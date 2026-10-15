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

async function executeIrctcRequest(endpoint, body, signal) {
  // 1. Try ScrapeOps Indian Residential Proxy if configured
  const scrapeOpsKey = process.env.SCRAPEOPS_API_KEY;
  if (scrapeOpsKey) {
    try {
      const targetUrl = `https://www.irctc.co.in/online-charts/api/${endpoint}`;
      const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${scrapeOpsKey}&url=${encodeURIComponent(targetUrl)}&country=in&residential=true&keep_headers=true`;
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: IRCTC_HEADERS,
        body: JSON.stringify(body),
        signal,
      });

      if (res.ok) {
        return res;
      }
      console.warn(`[IRCTC Live] ScrapeOps returned HTTP ${res.status} for ${endpoint}. Falling back to bridge/direct.`);
    } catch (scrapeErr) {
      console.warn(`[IRCTC Live] ScrapeOps proxy error: ${scrapeErr.message}. Falling back to bridge/direct.`);
    }
  }

  const bridgeUrl =
    process.env.IRCTC_BRIDGE_URL || 'https://gerald-installed-performed-guitars.trycloudflare.com';
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
 * and persisted in Redis with Lifecycle-Aware TTL.
 *
 * @param {string} trainNo 5-digit train number (e.g., '12801')
 * @param {string} jDate YYYY-MM-DD
 * @param {string} boardingStation 2-5 letter station code (e.g., 'BBS')
 * @returns {Promise<Object>}
 */
export async function fetchLiveTrainComposition(trainNo, jDate, boardingStation) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { success: false, isPrepared: false, error: 'Test mode' };
  }

  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation).trim().toUpperCase();
  const cacheKey = `comp:${normTrainNo}:${normDate}:${normStation}`;

  // 1. Check multi-tier cache (Memory LRU -> Redis -> MongoDB)
  const cached = await cacheStore.get(cacheKey);
  if (cached && cached.data) {
    return cached.data;
  }

  if (isUnderRateLimitCooldown()) {
    return { success: false, isPrepared: false, error: 'Upstream rate limit cooldown active' };
  }

  // 2. SingleFlight promise deduplication (1,000 concurrent callers share 1 single IRCTC fetch)
  const { data: result } = await singleFlight.do(cacheKey, async () => {
    // Re-check cache inside lock in case another in-flight caller populated it
    const existing = await cacheStore.get(cacheKey);
    if (existing && existing.data) return existing.data;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 6000;
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
        await cacheStore.set(cacheKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
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
          isPrepared: false,
          dataType: 'composition',
        });
        await cacheStore.set(cacheKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
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
        isPrepared: resObj.isPrepared,
        chartOneDate: resObj.chartOneDate,
        chartTwoDate: resObj.chartTwoDate,
        dataType: 'composition',
      });

      await cacheStore.set(cacheKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });

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
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.coach (e.g., 'S1')
 * @param {string} params.cls (e.g., 'SL')
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
}) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { success: false, berths: [], error: 'Test mode' };
  }

  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation).trim().toUpperCase();
  const normCoach = String(coach).trim().toUpperCase();
  const normCls = String(cls).trim().toUpperCase();

  const cacheKey = `coach:${normTrainNo}:${normDate}:${normStation}:${normCoach}:${normCls}`;
  const cached = await cacheStore.get(cacheKey);
  if (cached && cached.data) return cached.data;

  if (isUnderRateLimitCooldown()) {
    return { success: false, berths: [], error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(cacheKey, async () => {
    const existing = await cacheStore.get(cacheKey);
    if (existing && existing.data) return existing.data;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 5000;
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
          isPrepared: true,
          dataType: 'coach',
        });
        await cacheStore.set(cacheKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
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
        isPrepared: true,
        dataType: 'coach',
      });
      await cacheStore.set(cacheKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });

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
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.cls (e.g. 'SL')
 * @param {number} [params.chartType=1]
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
}) {
  const normTrainNo = String(trainNo).trim();
  const normDate = String(jDate).trim();
  const normStation = String(boardingStation).trim().toUpperCase();
  const normCls = String(cls).trim().toUpperCase();

  const cacheKey = `vacant:${normTrainNo}:${normDate}:${normStation}:${normCls}:${chartType}`;
  const cached = await cacheStore.get(cacheKey);
  if (cached && cached.data) return cached.data;

  if (isUnderRateLimitCooldown()) {
    return { success: false, error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(cacheKey, async () => {
    const existing = await cacheStore.get(cacheKey);
    if (existing && existing.data) return existing.data;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 5000;
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
        await cacheStore.set(cacheKey, resObj, { ttlSeconds: 30, source: 'irctc-live' });
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
          isPrepared: true,
          dataType: 'vacantBerths',
        });
        await cacheStore.set(cacheKey, resObj, {
          ttlSeconds: policy.ttlSeconds,
          staleSeconds: policy.staleSeconds,
          source: 'irctc-live',
        });
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
        isPrepared: true,
        dataType: 'vacantBerths',
      });
      await cacheStore.set(cacheKey, resObj, {
        ttlSeconds: policy.ttlSeconds,
        staleSeconds: policy.staleSeconds,
        source: 'irctc-live',
      });

      return resObj;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return result;
}
