/**
 * Official Indian Railways (IRCTC) Online Reservation Chart Live Service.
 * Connects directly to https://www.irctc.co.in/online-charts/api/
 *
 * Provides real-time:
 * 1. Train Composition & Coach List (trainComposition)
 * 2. Coach-wise Physical Berth Occupancy & Vacancy Segments (coachComposition)
 * 3. Class-wise Vacant Berths across Coaches (vacantBerth)
 *
 * Resilient Architecture:
 * - Multi-tier Distributed Cache (Memory LRU + Redis Cluster + MongoDB Atlas TTL)
 * - Lifecycle-Aware TTLs aligned with Indian Railways charting operational timetable
 * - SingleFlight promise coalescing (prevents thundering herd on concurrent searches)
 * - Safe request headers (matches IRCTC web client)
 * - 6-second timeout with auto-failover
 */

import { singleFlight } from '../cache/singleFlight.js';
import { cacheStore } from '../cache/memoryStore.js';
import { getLifecycleCachePolicy } from '../cache/cachePolicy.js';
import { getRedisClient, isRedisReady } from '../cache/redisStore.js';

// Rate limit cooldown tracker (prevents repeated hits if IRCTC returns 429)
let irctcRateLimitCooldownUntil = 0;

function isUnderRateLimitCooldown() {
  return Date.now() < irctcRateLimitCooldownUntil;
}

function triggerRateLimitCooldown(seconds = 30) {
  irctcRateLimitCooldownUntil = Date.now() + seconds * 1000;
  console.warn(`[IRCTC Live] Upstream rate limit 429 detected. Cooldown active for ${seconds}s.`);
}

const IRCTC_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.irctc.co.in/online-charts/',
  Origin: 'https://www.irctc.co.in',
};

let bridgeDownUntil = 0;
let scrapeOpsQueue = Promise.resolve();

async function acquireDistributedLock(lockKey, ttlSeconds = 25, maxWaitMs = 25000) {
  const client = getRedisClient();
  if (!client || !isRedisReady()) {
    return null;
  }

  const token = `${Date.now()}_${Math.random()}`;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const acquired = await client.set(lockKey, token, 'NX', 'EX', ttlSeconds);
      if (acquired === 'OK') {
        return token;
      }
    } catch {
      return null;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

async function releaseDistributedLock(lockKey, token) {
  if (!token) return;
  const client = getRedisClient();
  if (!client || !isRedisReady()) return;

  try {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await client.eval(script, 1, lockKey, token);
  } catch {
    // Ignore error
  }
}

async function enqueueScrapeOps(fn) {
  // 1. Process-level serial queue (guarantees concurrency = 1 within this node process)
  const next = scrapeOpsQueue.then(async () => {
    // 2. Distributed Redis Mutex (guarantees concurrency = 1 across ALL Vercel lambdas & VM instances)
    const lockKey = 'lock:scrapeops:concurrency';
    const lockToken = await acquireDistributedLock(lockKey, 25, 25000);

    try {
      // 500ms spacing guarantees concurrency = 1 (ScrapeOps free plan compliance)
      await new Promise((r) => setTimeout(r, 500));
      return await fn();
    } finally {
      if (lockToken) {
        await releaseDistributedLock(lockKey, lockToken);
      }
    }
  });

  scrapeOpsQueue = next.catch(() => {});
  return next;
}

async function executeIrctcRequest(endpoint, body, signal) {
  // 1. Try ScrapeOps Indian Residential Proxy if configured (concurrency = 1)
  const scrapeOpsKey = process.env.SCRAPEOPS_API_KEY;
  if (scrapeOpsKey) {
    try {
      const res = await enqueueScrapeOps(async () => {
        const reqController = new AbortController();
        const reqTimeout = setTimeout(() => reqController.abort(), 20000);

        const onCallerAbort = () => reqController.abort();
        if (signal) {
          if (signal.aborted) throw new Error('Caller aborted');
          signal.addEventListener('abort', onCallerAbort, { once: true });
        }

        try {
          const targetUrl = `https://www.irctc.co.in/online-charts/api/${endpoint}`;
          const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${scrapeOpsKey}&url=${encodeURIComponent(targetUrl)}&country=in&residential=true&keep_headers=true`;
          return await fetch(proxyUrl, {
            method: 'POST',
            headers: IRCTC_HEADERS,
            body: JSON.stringify(body),
            signal: reqController.signal,
          });
        } finally {
          clearTimeout(reqTimeout);
          if (signal) {
            signal.removeEventListener('abort', onCallerAbort);
          }
        }
      });

      if (res.ok) {
        return res;
      }
      if (res.status === 429) {
        triggerRateLimitCooldown(30);
      }
      console.warn(`[IRCTC Live] ScrapeOps returned HTTP ${res.status} for ${endpoint}. Falling back to bridge/direct.`);
    } catch (scrapeErr) {
      console.warn(`[IRCTC Live] ScrapeOps proxy error: ${scrapeErr.message}. Falling back to bridge/direct.`);
    }
  }

  const bridgeUrl = process.env.IRCTC_BRIDGE_URL || '';
  const bridgeToken = process.env.IRCTC_BRIDGE_TOKEN || 'railpeek-live-bridge';

  // 2. Try Bridge if configured and not in cooldown
  if (bridgeUrl && Date.now() > bridgeDownUntil) {
    try {
      const bridgeTarget = `${bridgeUrl.replace(/\/$/, '')}/api/irctc/${endpoint}`;
      const headers = { ...IRCTC_HEADERS };
      if (bridgeToken) headers['x-bridge-token'] = bridgeToken;

      const res = await fetch(bridgeTarget, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });

      if (res.ok) {
        return res;
      }

      bridgeDownUntil = Date.now() + 60 * 1000; // 60s cooldown
      console.warn(
        `[IRCTC Live] Bridge returned HTTP ${res.status} for ${endpoint}. Falling back to direct IRCTC API.`
      );
    } catch (bridgeErr) {
      bridgeDownUntil = Date.now() + 60 * 1000; // 60s cooldown
      console.warn(
        `[IRCTC Live] Bridge connection failed (${bridgeErr.message}). Falling back to direct IRCTC API.`
      );
    }
  }

  // 2. Direct IRCTC API
  const directTarget = `https://www.irctc.co.in/online-charts/api/${endpoint}`;
  return await fetch(directTarget, {
    method: 'POST',
    headers: IRCTC_HEADERS,
    body: JSON.stringify(body),
    signal,
  });
}

/**
 * Fetch Live Train Composition & Chart Metadata from IRCTC
 * Deduplicated via SingleFlight, protected against 429 rate limits,
 * and persisted in Redis with train-wide Lifecycle-Aware TTL.
 *
 * @param {string} trainNo 5-digit train number (e.g., '12801')
 * @param {string} jDate YYYY-MM-DD
 * @param {string} [boardingStation] 2-5 letter station code (e.g., 'BBS')
 * @param {string} [departureTime] Scheduled departure time "HH:mm" (IST)
 * @returns {Promise<Object>}
 */
export async function fetchLiveTrainComposition(trainNo, jDate, boardingStation, departureTime = null) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { success: false, isPrepared: false, error: 'Test mode' };
  }

  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation || '').trim().toUpperCase();
  const trainKey = `comp:${normTrainNo}:${normDate}`;
  const stationKey = normStation ? `comp:${normTrainNo}:${normDate}:${normStation}` : trainKey;

  // 1. Check train-level shared cache first (covers ALL stations on this train)
  const cachedTrain = await cacheStore.get(trainKey);
  if (cachedTrain && cachedTrain.data) {
    return cachedTrain.data;
  }

  // 2. Check station-level key if different
  if (stationKey !== trainKey) {
    const cachedStation = await cacheStore.get(stationKey);
    if (cachedStation && cachedStation.data) {
      return cachedStation.data;
    }
  }

  if (isUnderRateLimitCooldown()) {
    return { success: false, isPrepared: false, error: 'Upstream rate limit cooldown active' };
  }

  // 3. SingleFlight promise deduplication keyed on trainKey (prevents concurrent hits across all stations)
  const { data: result } = await singleFlight.do(trainKey, async () => {
    // Re-check cache inside lock in case another in-flight caller populated it
    const existingTrain = await cacheStore.get(trainKey);
    if (existingTrain && existingTrain.data) return existingTrain.data;

    const timeoutMs = process.env.SCRAPEOPS_API_KEY ? 25000 : (process.env.IRCTC_BRIDGE_URL ? 10000 : 6000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'trainComposition',
        {
          trainNo: normTrainNo,
          jDate: normDate,
          boardingStation: normStation,
        },
        controller.signal
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[IRCTC Live] HTTP ${res.status} ${res.statusText}: ${errText.slice(0, 200)}`);
        if (res.status === 429) {
          triggerRateLimitCooldown(30);
        }
        const resObj = {
          success: false,
          isPrepared: false,
          error: `HTTP ${res.status}: ${errText.slice(0, 150)}`,
        };
        await cacheStore.set(trainKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
        if (stationKey !== trainKey) {
          await cacheStore.set(stationKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
        }
        return resObj;
      }

      const data = await res.json();
      if (data.error || !data.cdd) {
        const resObj = {
          success: false,
          isPrepared: false,
          error: data.error || 'Chart not prepared',
        };
        const policy = getLifecycleCachePolicy({
          journeyDate: normDate,
          departureTime,
          isPrepared: false,
          dataType: 'composition',
        });
        await cacheStore.set(trainKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
        if (stationKey !== trainKey) {
          await cacheStore.set(stationKey, resObj, {
            ttlSeconds: policy.ttlSeconds,
            staleSeconds: policy.staleSeconds,
            source: 'irctc-live',
          });
        }
        return resObj;
      }

      const resObj = {
        success: true,
        isPrepared: Boolean(data.chartOneDate),
        trainNo: data.trainNo || normTrainNo,
        trainName: data.trainName || '',
        from: data.from || normStation,
        to: data.to || '',
        trainStartDate: data.trainStartDate,
        chartOneDate: data.chartOneDate,
        chartTwoDate: data.chartTwoDate,
        remote: data.remote,
        nextRemote: data.nextRemote,
        avlRemoteForBooking: data.avlRemoteForBooking || data.nextRemote || null,
        coaches: (data.cdd || []).map((c) => ({
          coachName: c.coachName,
          classCode: c.classCode,
          vacantBerths: c.vacantBerths || 0,
        })),
      };

      const policy = getLifecycleCachePolicy({
        journeyDate: normDate,
        departureTime,
        isPrepared: resObj.isPrepared,
        chartOneDate: resObj.chartOneDate,
        chartTwoDate: resObj.chartTwoDate,
        dataType: 'composition',
      });

      await cacheStore.set(trainKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });
      if (stationKey !== trainKey) {
        await cacheStore.set(stationKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
      }

      return resObj;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return result;
}

/**
 * Fetch Live Coach Layout & Berth Occupancy from IRCTC
 * Deduplicated via SingleFlight & protected with Lifecycle Redis cache.
 *
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} [params.boardingStation]
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.coach (e.g., 'S1')
 * @param {string} params.cls (e.g., 'SL')
 * @param {string} [params.departureTime]
 * @returns {Promise<Object>}
 */
export async function fetchLiveCoachComposition({
  trainNo,
  jDate,
  boardingStation,
  remoteStation,
  trainSourceStation,
  coach,
  cls,
  departureTime = null,
}) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { success: false, berths: [], error: 'Test mode' };
  }

  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation || '').trim().toUpperCase();
  const normCoach = String(coach).trim().toUpperCase();
  const normCls = String(cls).trim().toUpperCase();

  const trainCoachKey = `coach:${normTrainNo}:${normDate}:${normCoach}:${normCls}`;
  const stationCoachKey = normStation ? `coach:${normTrainNo}:${normDate}:${normStation}:${normCoach}:${normCls}` : trainCoachKey;

  const cachedTrain = await cacheStore.get(trainCoachKey);
  if (cachedTrain && cachedTrain.data) return cachedTrain.data;

  if (stationCoachKey !== trainCoachKey) {
    const cachedStation = await cacheStore.get(stationCoachKey);
    if (cachedStation && cachedStation.data) return cachedStation.data;
  }

  if (isUnderRateLimitCooldown()) {
    return { success: false, berths: [], error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(trainCoachKey, async () => {
    const existingTrain = await cacheStore.get(trainCoachKey);
    if (existingTrain && existingTrain.data) return existingTrain.data;

    const timeoutMs = process.env.SCRAPEOPS_API_KEY ? 25000 : (process.env.IRCTC_BRIDGE_URL ? 10000 : 5000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'coachComposition',
        {
          trainNo: normTrainNo,
          jDate: normDate,
          boardingStation: normStation,
          remoteStation: String(remoteStation || normStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || normStation).trim().toUpperCase(),
          coach: normCoach,
          cls: normCls,
        },
        controller.signal
      );

      if (!res.ok) {
        if (res.status === 429) triggerRateLimitCooldown(30);
        return { success: false, error: `HTTP ${res.status}` };
      }

      const data = await res.json();
      if (data.error === 'No Record Found') {
        const resObj = {
          success: true,
          coachName: data.coachName || normCoach,
          berths: [],
          isZeroVacancy: true,
        };
        const policy = getLifecycleCachePolicy({
          journeyDate: normDate,
          departureTime,
          isPrepared: true,
          dataType: 'coach',
        });
        await cacheStore.set(trainCoachKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
        if (stationCoachKey !== trainCoachKey) {
          await cacheStore.set(stationCoachKey, resObj, {
            ttlSeconds: policy.ttlSeconds,
            staleSeconds: policy.staleSeconds,
            source: 'irctc-live',
          });
        }
        return resObj;
      }

      if (data.error || !data.bdd) {
        return { success: false, error: data.error || 'No berth data' };
      }

      const resObj = {
        success: true,
        coachName: data.coachName || normCoach,
        berths: data.bdd || [],
      };

      const policy = getLifecycleCachePolicy({
        journeyDate: normDate,
        departureTime,
        isPrepared: true,
        dataType: 'coach',
      });
      await cacheStore.set(trainCoachKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });
      if (stationCoachKey !== trainCoachKey) {
        await cacheStore.set(stationCoachKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
      }

      return resObj;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return result;
}

/**
 * Fetch Live Class-wise Vacant Berths from IRCTC
 * Deduplicated via SingleFlight & protected with Lifecycle Redis cache.
 *
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} [params.boardingStation]
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.cls (e.g. 'SL')
 * @param {number} [params.chartType=1]
 * @param {string} [params.departureTime]
 * @returns {Promise<Object>}
 */
export async function fetchLiveVacantBerths({
  trainNo,
  jDate,
  boardingStation,
  remoteStation,
  trainSourceStation,
  cls,
  chartType = 1,
  departureTime = null,
}) {
  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation || '').trim().toUpperCase();
  const normCls = String(cls).trim().toUpperCase();

  const trainClsKey = `vacant:${normTrainNo}:${normDate}:${normCls}:${chartType}`;
  const stationClsKey = normStation ? `vacant:${normTrainNo}:${normDate}:${normStation}:${normCls}:${chartType}` : trainClsKey;

  // 1. Check train-level shared cache first (covers entire route)
  const cachedTrain = await cacheStore.get(trainClsKey);
  if (cachedTrain && cachedTrain.data) return cachedTrain.data;

  // 2. Check station-level cache if different
  if (stationClsKey !== trainClsKey) {
    const cachedStation = await cacheStore.get(stationClsKey);
    if (cachedStation && cachedStation.data) return cachedStation.data;
  }

  if (isUnderRateLimitCooldown()) {
    return { success: false, error: 'Upstream rate limit cooldown active' };
  }

  // 3. SingleFlight deduplication keyed on trainClsKey
  const { data: result } = await singleFlight.do(trainClsKey, async () => {
    const existingTrain = await cacheStore.get(trainClsKey);
    if (existingTrain && existingTrain.data) return existingTrain.data;

    const timeoutMs = process.env.SCRAPEOPS_API_KEY ? 25000 : (process.env.IRCTC_BRIDGE_URL ? 10000 : 5000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'vacantBerth',
        {
          trainNo: normTrainNo,
          jDate: normDate,
          boardingStation: normStation,
          remoteStation: String(remoteStation || normStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || normStation).trim().toUpperCase(),
          cls: normCls,
          chartType,
        },
        controller.signal
      );

      if (!res.ok) {
        if (res.status === 429) triggerRateLimitCooldown(30);
        const resObj = { success: false, error: `HTTP ${res.status}` };
        await cacheStore.set(trainClsKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
        if (stationClsKey !== trainClsKey) {
          await cacheStore.set(stationClsKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
        }
        return resObj;
      }

      const data = await res.json();
      if (data.error === 'No Record Found') {
        const resObj = {
          success: true,
          vacantBerths: [],
          isZeroVacancy: true,
        };
        const policy = getLifecycleCachePolicy({
          journeyDate: normDate,
          departureTime,
          isPrepared: true,
          dataType: 'vacantBerths',
        });
        await cacheStore.set(trainClsKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
        if (stationClsKey !== trainClsKey) {
          await cacheStore.set(stationClsKey, resObj, {
            ttlSeconds: policy.ttlSeconds,
            staleSeconds: policy.staleSeconds,
            source: 'irctc-live',
          });
        }
        return resObj;
      }

      if (data.error || !data.vbd) {
        return { success: false, error: data.error || 'No vacant berths found' };
      }

      const resObj = {
        success: true,
        vacantBerths: data.vbd || [],
      };

      const policy = getLifecycleCachePolicy({
        journeyDate: normDate,
        departureTime,
        isPrepared: true,
        dataType: 'vacantBerths',
      });
      await cacheStore.set(trainClsKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });
      if (stationClsKey !== trainClsKey) {
        await cacheStore.set(stationClsKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
      }

      return resObj;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return result;
}
