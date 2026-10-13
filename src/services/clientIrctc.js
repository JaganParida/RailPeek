/**
 * Client-Side Direct IRCTC Online Reservation Chart Synchronization Service
 *
 * Official IRCTC online-charts APIs:
 * - https://www.irctc.co.in/online-charts/api/trainComposition
 * - https://www.irctc.co.in/online-charts/api/vacantBerth
 *
 * Key Architectural Advantage:
 * IRCTC enables `Access-Control-Allow-Origin: *` with `POST, OPTIONS` support.
 * By querying directly from the passenger's browser on an Indian ISP connection (Jio, Airtel, Vi, etc.),
 * requests bypass datacenter/cloud IP restrictions (e.g. AWS/Vercel Akamai blocks) and retrieve
 * 100% official, real-time IRCTC chart timestamps and coach composition directly.
 */

const clientCache = new Map();

/**
 * Fetch Live Train Composition & Chart Metadata directly from IRCTC via client browser
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
    if (Date.now() - item.ts < 2 * 60 * 1000) {
      return item.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch('https://www.irctc.co.in/online-charts/api/trainComposition', {
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

    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.cdd) return null;

    const result = {
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
      coaches: data.cdd || [],
    };

    clientCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch Live Vacant Berths directly from IRCTC via client browser
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.cls
 * @param {number} [params.chartType=1]
 * @returns {Promise<Array|null>}
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
  if (typeof window === 'undefined') return null;
  if (!trainNo || !jDate || !boardingStation || !cls) return null;

  const key = `vacant:${trainNo}:${jDate}:${boardingStation}:${cls}:${chartType}`;
  if (clientCache.has(key)) {
    const item = clientCache.get(key);
    if (Date.now() - item.ts < 2 * 60 * 1000) {
      return item.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://www.irctc.co.in/online-charts/api/vacantBerth', {
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

    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.vbd) return null;

    const result = data.vbd || [];
    clientCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch Live Coach Composition (berth layout & split occupancies) directly from IRCTC via client browser
 * @param {Object} params
 * @param {string} params.trainNo
 * @param {string} params.jDate
 * @param {string} params.boardingStation
 * @param {string} [params.remoteStation]
 * @param {string} [params.trainSourceStation]
 * @param {string} params.coach (e.g. 'B1', 'S2')
 * @param {string} params.cls (e.g. '3A', 'SL')
 * @param {number} [params.chartType=1]
 * @returns {Promise<Array|null>}
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
  if (typeof window === 'undefined') return null;
  if (!trainNo || !jDate || !boardingStation || !coach || !cls) return null;

  const normCoach = String(coach).trim().toUpperCase();
  const normClass = String(cls).trim().toUpperCase();
  const key = `coach:${trainNo}:${jDate}:${boardingStation}:${normCoach}:${normClass}:${chartType}`;
  if (clientCache.has(key)) {
    const item = clientCache.get(key);
    if (Date.now() - item.ts < 2 * 60 * 1000) {
      return item.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://www.irctc.co.in/online-charts/api/coachComposition', {
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

    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.bdd) return null;

    const result = data.bdd || [];
    clientCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

