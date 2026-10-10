import { getRailwayProvider } from '../providers/index.js';
import { getAvailabilityCacheKey } from '../cache/cacheKey.js';
import { cacheStore } from '../cache/memoryStore.js';
import { singleFlight } from '../cache/singleFlight.js';
import { CACHE_POLICY } from '../cache/cachePolicy.js';
import { providerCircuitBreaker } from './circuitBreaker.js';
import { withRetry } from '../utils/retry.js';
import { metricsService } from './metrics.service.js';
import { availabilityResultSchema } from '../validators/provider.validator.js';
import { ApiError } from '../utils/apiResponse.js';

/**
 * Cache-First Availability Query Service.
 * Implements deterministic keys, single-flight coalescing, selective retry,
 * circuit breaker, response validation, and safe stale-while-revalidate.
 *
 * @param {Object} queryParams
 * @param {string} queryParams.trainNumber
 * @param {string} queryParams.date
 * @param {string} queryParams.from
 * @param {string} queryParams.to
 * @param {string} [queryParams.travelClass="3A"]
 * @param {string} [queryParams.quota="GN"]
 * @param {boolean} [queryParams.forceRefresh=false]
 * @returns {Promise<Object>}
 */
export async function getCachedAvailability(queryParams) {
  const startTime = Date.now();
  metricsService.increment('requestsTotal');

  const provider = getRailwayProvider();
  const providerMode = provider.name === 'MockRailwayProvider' ? 'mock' : 'live';

  const cacheKey = getAvailabilityCacheKey({
    provider: providerMode,
    trainNumber: queryParams.trainNumber,
    date: queryParams.date,
    from: queryParams.from,
    to: queryParams.to,
    travelClass: queryParams.travelClass,
    coach: queryParams.coach,
    quota: queryParams.quota,
  });

  const policy = CACHE_POLICY.availability;

  // 1. Cache Lookup
  const cached = await cacheStore.get(cacheKey);

  // 1A. Handle Manual Refresh with Anti-Hammer Cooldown (30s)
  if (queryParams.forceRefresh && cached) {
    const ageSeconds = (Date.now() - new Date(cached.fetchedAt).getTime()) / 1000;
    if (ageSeconds < 30) {
      // Cooldown active: Do not hammer provider; return fresh cache
      metricsService.increment('cacheHits');
      metricsService.recordLatency(Date.now() - startTime);
      return {
        ...cached.data,
        meta: {
          cacheKey,
          source: 'cache',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          isRevalidating: false,
          refreshed: false,
          cooldownActive: true,
        },
      };
    }
  }

  // 1B. Standard Cache Hit (when not forced refresh)
  if (cached && !queryParams.forceRefresh) {
    if (!cached.isStale) {
      // Fresh hit! 0 provider calls.
      metricsService.increment('cacheHits');
      metricsService.recordLatency(Date.now() - startTime);
      return {
        ...cached.data,
        meta: {
          cacheKey,
          source: 'cache',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          isRevalidating: false,
        },
      };
    }

    // Stale Hit (SWR): Serve immediate result and trigger background revalidation
    metricsService.increment('cacheStaleHits');
    triggerBackgroundRevalidation(cacheKey, queryParams, policy);

    metricsService.recordLatency(Date.now() - startTime);
    return {
      ...cached.data,
      meta: {
        cacheKey,
        source: 'cache',
        fetchedAt: cached.fetchedAt,
        isStale: true,
        isRevalidating: true,
      },
    };
  }

  // 2. Cache Miss: Execute single-flight fetch with retry & circuit breaker
  metricsService.increment('cacheMisses');

  try {
    const { data: rawProviderData, coalesced } = await singleFlight.do(
      cacheKey,
      async (signal) => {
        return await providerCircuitBreaker.execute(async () => {
          metricsService.increment('providerCalls');

          return await withRetry(
            async () => {
              return await provider.getAvailability(queryParams);
            },
            {
              maxRetries: 2,
              initialDelayMs: 200,
              signal,
            }
          );
        });
      }
    );

    if (coalesced) {
      metricsService.increment('coalescedRequests');
    }

    // 3. Strict Provider Response Validation before Caching
    const parseResult = availabilityResultSchema.safeParse(rawProviderData);
    if (!parseResult.success) {
      console.error(
        `[RailPeek Validation] Malformed provider response for ${cacheKey}:`,
        parseResult.error.format()
      );

      // If a previous cached result exists, preserve it and return it rather than crashing
      if (cached) {
        return {
          ...cached.data,
          meta: {
            cacheKey,
            source: 'cache',
            fetchedAt: cached.fetchedAt,
            isStale: true,
            isDegraded: true,
          },
        };
      }

      throw new ApiError(
        'MALFORMED_PROVIDER_RESPONSE',
        'The upstream railway data could not be validated.',
        502
      );
    }

    const validatedData = parseResult.data;

    // 4. Cache Write (with negative caching if train has empty berths/invalid)
    const isNegativeResult = validatedData.berths.length === 0;
    const effectiveTtl = isNegativeResult ? 60 : policy.ttlSeconds; // 60s for negative results

    await cacheStore.set(cacheKey, validatedData, {
      ttlSeconds: effectiveTtl,
      staleSeconds: isNegativeResult ? 30 : policy.staleSeconds,
      source: validatedData.source || providerMode,
    });

    metricsService.recordLatency(Date.now() - startTime);

    return {
      ...validatedData,
      meta: {
        cacheKey,
        source: validatedData.source || providerMode,
        fetchedAt: validatedData.fetchedAt,
        isStale: false,
        isRevalidating: false,
        coalesced,
      },
    };
  } catch (err) {
    metricsService.increment('providerFailures');

    // If an error occurred but we have an unexpired previous cache, fall back safely
    if (cached && policy.allowStaleOnFailure) {
      return {
        ...cached.data,
        meta: {
          cacheKey,
          source: 'cache',
          fetchedAt: cached.fetchedAt,
          isStale: true,
          isDegraded: true,
        },
      };
    }

    throw err;
  }
}

/**
 * Controlled background revalidation for stale cache hits.
 */
function triggerBackgroundRevalidation(cacheKey, queryParams, policy) {
  singleFlight
    .do(cacheKey, async (signal) => {
      return await providerCircuitBreaker.execute(async () => {
        metricsService.increment('providerCalls');
        return await withRetry(
          async () => {
            const provider = getRailwayProvider();
            return await provider.getAvailability(queryParams);
          },
          { maxRetries: 1, signal }
        );
      });
    })
    .then(({ data }) => {
      const parseResult = availabilityResultSchema.safeParse(data);
      if (parseResult.success) {
        cacheStore.set(cacheKey, parseResult.data, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: parseResult.data.source || 'cache',
        });
      }
    })
    .catch((err) => {
      metricsService.increment('providerFailures');
      console.warn(`[RailPeek Revalidation] Background revalidation failed: ${err.message}`);
    });
}
