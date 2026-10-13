/**
 * Same-Origin IRCTC Online Reservation Chart Synchronization Service
 *
 * Routes through same-origin API:
 * - /api/v1/coaches/irctc/trainComposition
 * - /api/v1/coaches/irctc/vacantBerth
 * - /api/v1/coaches/irctc/coachComposition
 *
 * Key Architectural Advantage:
 * By proxying via same-origin `/api/v1/coaches/irctc/...`, the browser never gets blocked
 * by CORS (`Access-Control-Allow-Origin`). Requests are server-to-server with SingleFlight
 * deduplication, zero console errors, and high performance.
 */

const clientCache = new Map();
const inFlightPromises = new Map();

/**
 * Fetch Live Train Composition & Chart Metadata
 * @param {string} trainNo 5-digit train number
 * @param {string} jDate YYYY-MM-DD
 * @param {string} boardingStation Station code (e.g. BBS)
 * @returns {Promise<Object|null>}
 */
export async function fetchBrowserTrainComposition(trainNo, jDate, boardingStation) {
  if (typeof window === 'undefined') return null;
  if (!trainNo || !jDate || !boardingStation) return null;

  const key = `comp:${trainNo}:${jDate}:${boardingStation}`;
  if (clientCache.has(key)) {
    const item = clientCache.get(key);
    if (Date.now() - item.ts < 5 * 60 * 1000) {
      return item.data;
    }
  }

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/v1/coaches/irctc/trainComposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        clientCache.set(key, { data: null, ts: Date.now() });
        return null;
      }
      const json = await res.json();
      const data = json.data || json;
      if (!data || data.error || !data.success) {
        clientCache.set(key, { data: null, ts: Date.now() });
        return null;
      }

      clientCache.set(key, { data, ts: Date.now() });
      return data;
    } catch (_e) {
      clientCache.set(key, { data: null, ts: Date.now() });
      return null;
    } finally {
      clearTimeout(timeoutId);
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Fetch Live Vacant Berths
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.cls
 * @param {number} [params.chartType=1]
 * @returns {Promise<Array>}
 */
export async function fetchBrowserVacantBerths({
  trainNo,
  jDate,
  boardingStation,
  remoteStation,
  trainSourceStation,
  cls,
  chartType = 1,
}) {
  if (typeof window === 'undefined') return [];
  if (!trainNo || !jDate || !boardingStation || !cls) return [];

  const key = `vacant:${trainNo}:${jDate}:${boardingStation}:${cls}:${chartType}`;
  if (clientCache.has(key)) {
    const item = clientCache.get(key);
    if (Date.now() - item.ts < 5 * 60 * 1000) {
      return item.data || [];
    }
  }

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/v1/coaches/irctc/vacantBerth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
          remoteStation: String(remoteStation || boardingStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || boardingStation).trim().toUpperCase(),
          cls: String(cls).trim().toUpperCase(),
          chartType,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        clientCache.set(key, { data: [], ts: Date.now() });
        return [];
      }
      const json = await res.json();
      const rawData = json.data || json;
      const vbdList = Array.isArray(rawData?.vbd)
        ? rawData.vbd
        : Array.isArray(rawData)
        ? rawData
        : [];

      clientCache.set(key, { data: vbdList, ts: Date.now() });
      return vbdList;
    } catch (_e) {
      clientCache.set(key, { data: [], ts: Date.now() });
      return [];
    } finally {
      clearTimeout(timeoutId);
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Fetch Live Coach Composition (berth layout & split occupancies)
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.coach (e.g. 'B1', 'S2')
 * @param {string} params.cls (e.g. '3A', 'SL')
 * @param {number} [params.chartType=1]
 * @returns {Promise<Array>}
 */
export async function fetchBrowserCoachComposition({
  trainNo,
  jDate,
  boardingStation,
  remoteStation,
  trainSourceStation,
  coach,
  cls,
  chartType = 1,
}) {
  if (typeof window === 'undefined') return [];
  if (!trainNo || !jDate || !boardingStation || !coach || !cls) return [];

  const normCoach = String(coach).trim().toUpperCase();
  const normClass = String(cls).trim().toUpperCase();
  const key = `coach:${trainNo}:${jDate}:${boardingStation}:${normCoach}:${normClass}:${chartType}`;
  if (clientCache.has(key)) {
    const item = clientCache.get(key);
    if (Date.now() - item.ts < 5 * 60 * 1000) {
      return item.data || [];
    }
  }

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/v1/coaches/irctc/coachComposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainNo: String(trainNo).trim(),
          jDate: String(jDate).trim(),
          boardingStation: String(boardingStation).trim().toUpperCase(),
          remoteStation: String(remoteStation || boardingStation).trim().toUpperCase(),
          trainSourceStation: String(trainSourceStation || boardingStation).trim().toUpperCase(),
          coach: normCoach,
          cls: normClass,
          chartType,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        clientCache.set(key, { data: [], ts: Date.now() });
        return [];
      }
      const json = await res.json();
      const rawData = json.data || json;
      const bddList = Array.isArray(rawData?.bdd)
        ? rawData.bdd
        : Array.isArray(rawData)
        ? rawData
        : [];

      clientCache.set(key, { data: bddList, ts: Date.now() });
      return bddList;
    } catch (_e) {
      clientCache.set(key, { data: [], ts: Date.now() });
      return [];
    } finally {
      clearTimeout(timeoutId);
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}
