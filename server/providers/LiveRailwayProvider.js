import { RailwayProvider } from './RailwayProvider.js';
import { MockRailwayProvider } from './MockRailwayProvider.js';
import { env } from '../config/env.js';
import { CircuitBreaker } from '../services/circuitBreaker.js';
import { withRetry } from '../utils/retry.js';
import { ApiError } from '../utils/apiResponse.js';
import {
  stationSchema,
  trainSchema,
  routeStopSchema,
} from '../validators/provider.validator.js';

/**
 * Production-ready Live Railway Provider.
 * Connects to external verified railway APIs (e.g. IRCTC/National Train Enquiry gateways).
 *
 * Strict Compliance:
 * - Rule #29 & #30: Live data is tagged with source: 'live', isDemo: false.
 * - Never disguises fake data as live.
 * - Optional fallback mode (when configured) transparently tags demo data with isFallback: true.
 * - Circuit breaker and bounded retry protection prevent cascading failures.
 */
export class LiveRailwayProvider extends RailwayProvider {
  /**
   * @param {Object} [config]
   * @param {string} [config.apiKey]
   * @param {string} [config.baseUrl]
   * @param {string} [config.apiHost]
   * @param {boolean} [config.fallbackToMock]
   */
  constructor(config = {}) {
    super('LiveRailwayProvider');
    this.apiKey = config.apiKey ?? env.RAILWAY_API_KEY;
    this.baseUrl = (config.baseUrl ?? env.RAILWAY_API_URL ?? '').replace(/\/$/, '');
    this.apiHost = config.apiHost ?? env.RAILWAY_API_HOST;
    this.fallbackToMock = config.fallbackToMock ?? env.LIVE_PROVIDER_FALLBACK_TO_DEMO;

    this.mockProvider = new MockRailwayProvider();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      cooldownMs: 30000,
    });
  }

  /**
   * Check if live provider credentials are fully configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && this.baseUrl);
  }

  /**
   * Throws 503 if provider credentials are not configured
   */
  _ensureConfigured() {
    if (!this.isConfigured()) {
      throw new ApiError(
        'LIVE_PROVIDER_UNCONFIGURED',
        'Live railway provider credentials are not configured on this server.',
        503
      );
    }
  }

  /**
   * Protected HTTP request with timeout, circuit breaker, and retry
   * @param {string} endpoint
   * @param {Object} [options]
   * @returns {Promise<any>}
   */
  async _fetch(endpoint, options = {}) {
    this._ensureConfigured();

    return this.circuitBreaker.execute(async () => {
      return withRetry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 6000);

          const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
          const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
          };

          if (this.apiKey) {
            headers['X-RapidAPI-Key'] = this.apiKey;
            headers['Authorization'] = `Bearer ${this.apiKey}`;
          }
          if (this.apiHost) {
            headers['X-RapidAPI-Host'] = this.apiHost;
          }

          try {
            const response = await fetch(url, {
              method: options.method || 'GET',
              headers,
              body: options.body ? JSON.stringify(options.body) : undefined,
              signal: controller.signal,
            });

            if (!response.ok) {
              if (response.status === 404) {
                throw new ApiError('NOT_FOUND', `Resource at ${endpoint} was not found upstream`, 404);
              }
              if (response.status === 429) {
                throw new ApiError('PROVIDER_RATE_LIMITED', 'Upstream railway provider rate limit exceeded', 429);
              }
              throw new ApiError(
                'UPSTREAM_PROVIDER_ERROR',
                `Upstream railway provider returned HTTP ${response.status}`,
                response.status >= 500 ? 502 : response.status
              );
            }

            return await response.json();
          } finally {
            clearTimeout(timeoutId);
          }
        },
        {
          maxRetries: 2,
          initialDelayMs: 200,
          maxDelayMs: 1500,
        }
      );
    });
  }

  /**
   * Tags fallback responses with transparent demo disclosures
   * @param {any} result
   * @param {string} reason
   * @returns {any}
   */
  _tagFallback(result, reason) {
    if (Array.isArray(result)) {
      return result.map((item) => ({
        ...item,
        source: 'demo',
        isDemo: true,
        isFallback: true,
        fallbackReason: reason,
      }));
    }
    if (result && typeof result === 'object') {
      return {
        ...result,
        source: 'demo',
        isDemo: true,
        isFallback: true,
        fallbackReason: reason,
      };
    }
    return result;
  }

  /**
   * Execute live call or gracefully fall back to demo if configured
   * @template T
   * @param {string} operationName
   * @param {() => Promise<T>} liveFn
   * @param {() => Promise<T>} fallbackFn
   * @returns {Promise<T>}
   */
  async _executeWithFallback(operationName, liveFn, fallbackFn) {
    if (!this.isConfigured()) {
      if (this.fallbackToMock) {
        console.warn(`[RailPeek Live Provider] Unconfigured. Falling back to Demo for ${operationName}.`);
        const result = await fallbackFn();
        return this._tagFallback(result, 'LIVE_PROVIDER_UNCONFIGURED');
      }
      this._ensureConfigured();
    }

    try {
      return await liveFn();
    } catch (err) {
      if (this.fallbackToMock) {
        console.warn(`[RailPeek Live Provider] Error in ${operationName}: ${err.message}. Falling back to Demo.`);
        const result = await fallbackFn();
        return this._tagFallback(result, err.code || 'UPSTREAM_FAILURE');
      }
      throw err;
    }
  }

  /**
   * Search stations by query
   */
  async searchStations(query, limit = 10) {
    return this._executeWithFallback(
      'searchStations',
      async () => {
        const raw = await this._fetch(`/stations/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

        const normalized = [];
        for (const s of list) {
          const item = {
            code: String(s.code || s.stationCode || '').toUpperCase().trim(),
            name: String(s.name || s.stationName || '').trim(),
            city: String(s.city || s.cityName || s.name || '').trim(),
            state: String(s.state || s.stateName || 'IR').trim(),
            zone: String(s.zone || 'IR').trim(),
          };

          const parsed = stationSchema.safeParse(item);
          if (parsed.success) {
            normalized.push({
              ...parsed.data,
              source: 'live',
              isDemo: false,
              fetchedAt: new Date().toISOString(),
            });
          }
        }

        return normalized.slice(0, limit);
      },
      () => this.mockProvider.searchStations(query, limit)
    );
  }

  /**
   * Get single station details by code
   */
  async getStation(code) {
    return this._executeWithFallback(
      'getStation',
      async () => {
        const raw = await this._fetch(`/stations/${encodeURIComponent(code)}`);
        const s = raw?.data || raw;
        if (!s || !s.code) return null;

        const item = {
          code: String(s.code || s.stationCode).toUpperCase().trim(),
          name: String(s.name || s.stationName).trim(),
          city: String(s.city || s.cityName || s.name).trim(),
          state: String(s.state || s.stateName || 'IR').trim(),
          zone: String(s.zone || 'IR').trim(),
        };

        const parsed = stationSchema.parse(item);
        return {
          ...parsed,
          source: 'live',
          isDemo: false,
          fetchedAt: new Date().toISOString(),
        };
      },
      () => this.mockProvider.getStation(code)
    );
  }

  /**
   * Search trains running between origin and destination on a given date
   */
  async searchTrains(from, to, date) {
    return this._executeWithFallback(
      'searchTrains',
      async () => {
        const raw = await this._fetch(`/trains/between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

        const normalized = [];
        for (const t of list) {
          const item = {
            number: String(t.number || t.trainNumber || '').trim(),
            name: String(t.name || t.trainName || '').trim(),
            origin: String(t.origin || t.from || from).toUpperCase().trim(),
            originName: String(t.originName || t.fromName || from).trim(),
            destination: String(t.destination || t.to || to).toUpperCase().trim(),
            destinationName: String(t.destinationName || t.toName || to).trim(),
            classes: Array.isArray(t.classes) ? t.classes : ['3A', '2A', 'SL'],
            daysOfRun: Array.isArray(t.daysOfRun) ? t.daysOfRun : [0, 1, 2, 3, 4, 5, 6],
          };

          const parsed = trainSchema.safeParse(item);
          if (parsed.success) {
            normalized.push({
              ...parsed.data,
              departureTime: t.departureTime || t.departure,
              arrivalTime: t.arrivalTime || t.arrival,
              durationMinutes: t.durationMinutes,
              distanceKm: t.distanceKm,
              source: 'live',
              isDemo: false,
              fetchedAt: new Date().toISOString(),
            });
          }
        }

        return normalized;
      },
      () => this.mockProvider.searchTrains(from, to, date)
    );
  }

  /**
   * Get full train schedule and ordered route stops
   */
  async getTrainRoute(trainNumber) {
    return this._executeWithFallback(
      'getTrainRoute',
      async () => {
        const raw = await this._fetch(`/trains/${encodeURIComponent(trainNumber)}/route`);
        const train = raw?.train || raw?.data?.train;
        const rawRoute = raw?.route || raw?.data?.route;

        if (!train || !Array.isArray(rawRoute)) return null;

        const normalizedRoute = [];
        for (let idx = 0; idx < rawRoute.length; idx++) {
          const s = rawRoute[idx];
          const item = {
            stationCode: String(s.stationCode || s.code).toUpperCase().trim(),
            stationName: String(s.stationName || s.name).trim(),
            stopIndex: idx,
            arrival: s.arrival || '--:--',
            departure: s.departure || '--:--',
            distanceKm: Number(s.distanceKm || s.distance || 0),
            dayCount: Number(s.dayCount || 1),
            haltMinutes: Number(s.haltMinutes || 0),
          };

          const parsed = routeStopSchema.safeParse(item);
          if (parsed.success) {
            normalizedRoute.push({
              ...parsed.data,
              source: 'live',
              isDemo: false,
            });
          }
        }

        return {
          train: {
            ...train,
            source: 'live',
            isDemo: false,
            fetchedAt: new Date().toISOString(),
          },
          route: normalizedRoute,
        };
      },
      () => this.mockProvider.getTrainRoute(trainNumber)
    );
  }

  /**
   * Fetch berth availability and chart occupancy
   */
  async getAvailability(params) {
    return this._executeWithFallback(
      'getAvailability',
      async () => {
        const { trainNumber, date, from, to, travelClass = '3A', quota = 'GN' } = params;
        const raw = await this._fetch(
          `/availability?train=${encodeURIComponent(trainNumber)}&date=${encodeURIComponent(date)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&class=${encodeURIComponent(travelClass)}&quota=${encodeURIComponent(quota)}`
        );

        return {
          trainNumber,
          trainName: raw?.trainName || '',
          journeyDate: date,
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          travelClass,
          coach: raw?.coach || 'B1',
          berths: Array.isArray(raw?.berths) ? raw.berths : [],
          chartStatus: raw?.chartStatus || 'CHART_PREPARED',
          source: 'live',
          isDemo: false,
          fetchedAt: new Date().toISOString(),
        };
      },
      () => this.mockProvider.getAvailability(params)
    );
  }

  /**
   * Fetch coach layout
   */
  async getCoachLayout(trainNumber, date, coachId) {
    return this._executeWithFallback(
      'getCoachLayout',
      async () => {
        const raw = await this._fetch(
          `/coaches/${encodeURIComponent(trainNumber)}/${encodeURIComponent(coachId)}?date=${encodeURIComponent(date)}`
        );

        return {
          trainNumber,
          date,
          coachId,
          travelClass: raw?.travelClass || (coachId.startsWith('A') ? '2A' : '3A'),
          berths: Array.isArray(raw?.berths) ? raw.berths : [],
          source: 'live',
          isDemo: false,
          fetchedAt: new Date().toISOString(),
        };
      },
      () => this.mockProvider.getCoachLayout(trainNumber, date, coachId)
    );
  }
}
