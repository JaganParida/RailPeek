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
 * - In-memory TTL cache (prevents duplicate requests to IRCTC)
 * - Safe request headers (matches IRCTC web client)
 * - 4-second timeout with fallback handling
 */

import { singleFlight } from '../cache/singleFlight.js';

const SUCCESS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FAILURE_CACHE_TTL_MS = 30 * 1000; // 30 seconds for transient errors or unprepared
const cache = new Map();

// Rate limit cooldown tracker (prevents repeated hits if IRCTC returns 429)
let irctcRateLimitCooldownUntil = 0;

function isUnderRateLimitCooldown() {
  return Date.now() < irctcRateLimitCooldownUntil;
}

function triggerRateLimitCooldown(seconds = 30) {
  irctcRateLimitCooldownUntil = Date.now() + seconds * 1000;
  console.warn(`[IRCTC Live] Upstream rate limit 429 detected. Cooldown active for ${seconds}s.`);
}

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < (item.ttl || SUCCESS_CACHE_TTL_MS)) {
    return item.data;
  }
  return null;
}

function setCached(key, data, ttl = SUCCESS_CACHE_TTL_MS) {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

const IRCTC_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.irctc.co.in/online-charts/',
  'Origin': 'https://www.irctc.co.in',
};

async function executeIrctcRequest(endpoint, body, signal) {
  const bridgeUrl = process.env.IRCTC_BRIDGE_URL;
  const bridgeToken = process.env.IRCTC_BRIDGE_TOKEN;

  // 1. Try Bridge first if configured
  if (bridgeUrl) {
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

      console.warn(`[IRCTC Live] Bridge returned HTTP ${res.status} for ${endpoint}. Falling back to direct IRCTC API.`);
    } catch (bridgeErr) {
      console.warn(`[IRCTC Live] Bridge connection failed (${bridgeErr.message}). Falling back to direct IRCTC API.`);
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
 * Deduplicated via SingleFlight & protected against 429 rate limits.
 * @param {string} trainNo 5-digit train number (e.g., '12801')
 * @param {string} jDate YYYY-MM-DD
 * @param {string} boardingStation 2-5 letter station code (e.g., 'BBS')
 * @returns {Promise<Object>}
 */
export async function fetchLiveTrainComposition(trainNo, jDate, boardingStation) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { success: false, isPrepared: false, error: 'Test mode' };
  }

  const cacheKey = `comp:${trainNo}:${jDate}:${boardingStation}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (isUnderRateLimitCooldown()) {
    return { success: false, isPrepared: false, error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(cacheKey, async () => {
    // Re-check cache inside lock in case another in-flight caller populated it
    const existing = getCached(cacheKey);
    if (existing) return existing;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 6000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'trainComposition',
        {
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
        },
        controller.signal
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[IRCTC Live] HTTP ${res.status} ${res.statusText}: ${errText.slice(0, 200)}`);
        if (res.status === 429) {
          triggerRateLimitCooldown(30);
        }
        const resObj = { success: false, isPrepared: false, error: `HTTP ${res.status}: ${errText.slice(0, 150)}` };
        setCached(cacheKey, resObj, FAILURE_CACHE_TTL_MS);
        return resObj;
      }

      const data = await res.json();
      if (data.error || !data.cdd) {
        const resObj = {
          success: false,
          isPrepared: false,
          error: data.error || 'Chart not prepared',
        };
        setCached(cacheKey, resObj, FAILURE_CACHE_TTL_MS);
        return resObj;
      }

      const resObj = {
        success: true,
        isPrepared: Boolean(data.chartOneDate),
        trainNo: data.trainNo,
        trainName: data.trainName,
        from: data.from,
        to: data.to,
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

      setCached(cacheKey, resObj);
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
 * Deduplicated via SingleFlight & protected against 429 rate limits.
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} params.remoteStation
 * @param {string} params.trainSourceStation
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

  const cacheKey = `coach:${trainNo}:${jDate}:${boardingStation}:${coach}:${cls}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (isUnderRateLimitCooldown()) {
    return { success: false, berths: [], error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(cacheKey, async () => {
    const existing = getCached(cacheKey);
    if (existing) return existing;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'coachComposition',
        {
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
          remoteStation: String(remoteStation || boardingStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || boardingStation).trim().toUpperCase(),
          coach: String(coach).trim().toUpperCase(),
          cls: String(cls).trim().toUpperCase(),
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
          coachName: data.coachName || coach,
          berths: [],
          isZeroVacancy: true,
        };
        setCached(cacheKey, resObj);
        return resObj;
      }

      if (data.error || !data.bdd) {
        return { success: false, error: data.error || 'No berth data' };
      }

      const resObj = {
        success: true,
        coachName: data.coachName || coach,
        berths: data.bdd || [],
      };

      setCached(cacheKey, resObj);
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
 * Deduplicated via SingleFlight & protected against 429 rate limits.
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} params.remoteStation
 * @param {string} params.trainSourceStation
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
  const cacheKey = `vacant:${trainNo}:${jDate}:${boardingStation}:${cls}:${chartType}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (isUnderRateLimitCooldown()) {
    return { success: false, error: 'Upstream rate limit cooldown active' };
  }

  const { data: result } = await singleFlight.do(cacheKey, async () => {
    const existing = getCached(cacheKey);
    if (existing) return existing;

    const timeoutMs = process.env.IRCTC_BRIDGE_URL ? 10000 : 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await executeIrctcRequest(
        'vacantBerth',
        {
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
          remoteStation: String(remoteStation || boardingStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || boardingStation).trim().toUpperCase(),
          cls: String(cls).trim().toUpperCase(),
          chartType,
        },
        controller.signal
      );

      if (!res.ok) {
        if (res.status === 429) triggerRateLimitCooldown(30);
        const resObj = { success: false, error: `HTTP ${res.status}` };
        setCached(cacheKey, resObj, FAILURE_CACHE_TTL_MS);
        return resObj;
      }

      const data = await res.json();
      if (data.error === 'No Record Found') {
        const resObj = {
          success: true,
          vacantBerths: [],
          isZeroVacancy: true,
        };
        setCached(cacheKey, resObj);
        return resObj;
      }

      if (data.error || !data.vbd) {
        return { success: false, error: data.error || 'No vacant berths found' };
      }

      const resObj = {
        success: true,
        vacantBerths: data.vbd || [],
      };

      setCached(cacheKey, resObj);
      return resObj;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return result;
}
