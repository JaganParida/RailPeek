import https from 'https';
import { MOCK_ROUTES } from '../mockData/routes.mock.js';

const routeCache = new Map();
let stationDict = null;

// Railway Terminal Clusters where different stations serve the same metropolitan area
export const TERMINAL_CLUSTERS = {
  NDLS: ['NDLS', 'NZM', 'ANVT', 'DLI', 'DEE'],
  NZM: ['NDLS', 'NZM', 'ANVT', 'DLI', 'DEE'],
  ANVT: ['NDLS', 'NZM', 'ANVT', 'DLI', 'DEE'],
  DLI: ['NDLS', 'NZM', 'ANVT', 'DLI', 'DEE'],
  DEE: ['NDLS', 'NZM', 'ANVT', 'DLI', 'DEE'],
  HWH: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  SDAH: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  SHM: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  KOAA: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  CSMT: ['CSMT', 'MMCT', 'BDTS', 'LTT', 'DR'],
  MMCT: ['CSMT', 'MMCT', 'BDTS', 'LTT', 'DR'],
  BDTS: ['CSMT', 'MMCT', 'BDTS', 'LTT', 'DR'],
  LTT: ['CSMT', 'MMCT', 'BDTS', 'LTT', 'DR'],
  DR: ['CSMT', 'MMCT', 'BDTS', 'LTT', 'DR'],
  DBRG: ['DBRG', 'DBRT'],
  DBRT: ['DBRG', 'DBRT'],
};

/**
 * Load Indian Railways station dictionary mapping station names to official codes
 */
async function getStationDict() {
  if (stationDict) return stationDict;

  try {
    const url = 'https://erail.in/js/cmp/stations.js';
    const raw = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => resolve(b));
      }).on('error', reject);
    });

    const m = raw.match(/var StationsData="([\s\S]*?)";/);
    const nameToCode = new Map();
    if (m) {
      const tokens = m[1].split(',');
      for (let i = 0; i < tokens.length - 1; i += 2) {
        const code = tokens[i].trim().toUpperCase();
        const name = tokens[i + 1].trim().toUpperCase();
        if (code && name) {
          nameToCode.set(name, code);
          const norm = name
            .replace(/\s+JN$/, '')
            .replace(/\s+JUNCTION$/, '')
            .replace(/\s+H$/, '')
            .replace(/[^A-Z0-9]/g, '');
          nameToCode.set(norm, code);
        }
      }
    }
    stationDict = nameToCode;
    return stationDict;
  } catch (_e) {
    stationDict = new Map();
    return stationDict;
  }
}

/**
 * Get ordered list of station stops for a train
 * @param {string} trainNumber
 * @returns {Promise<Array<{ stopIndex: number, stationCode: string, stationName: string }>>}
 */
export async function getTrainRouteStops(trainNumber) {
  const tNo = String(trainNumber || '').trim();
  if (!tNo) return [];

  if (routeCache.has(tNo)) return routeCache.get(tNo);

  // Check mock routes first if running unit tests
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    const mock = MOCK_ROUTES[tNo];
    if (mock) {
      routeCache.set(tNo, mock);
      return mock;
    }
    return [];
  }

  // Fetch live route from erail train enquiry
  try {
    const dict = await getStationDict();
    const url = `https://erail.in/train-enquiry/${tNo}`;
    const html = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => resolve(b));
      }).on('error', reject);
    });

    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const stops = [];

    for (const r of rows) {
      const cells = r.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells || cells.length < 4) continue;
      const idxText = cells[0].replace(/<[^>]+>/g, '').trim();
      const idx = parseInt(idxText, 10);
      if (isNaN(idx)) continue;

      const rawName = cells[1].replace(/<[^>]+>/g, '').trim().toUpperCase();
      let code = dict.get(rawName);
      if (!code) {
        // Strip out trailing quota or indicator tags in parentheses like (RL), (PQ), etc.
        const withoutQuota = rawName.replace(/\s*\((?:RL|PQ|GN|RAC|WL|RS|CK|PT)\)$/i, '').trim();
        code = dict.get(withoutQuota);
      }
      if (!code) {
        // Also try stripping any trailing parenthesis
        const withoutAnyParen = rawName.replace(/\s*\([^)]*\)$/, '').trim();
        code = dict.get(withoutAnyParen);
      }
      if (!code) {
        const norm = rawName
          .replace(/\s*\([^)]*\)$/, '')
          .replace(/\s+JN$/, '')
          .replace(/\s+JUNCTION$/, '')
          .replace(/\s+H$/, '')
          .replace(/[^A-Z0-9]/g, '');
        code = dict.get(norm);
      }

      if (code) {
        let dist = 0;
        if (cells.length > 4) {
          const rawDist = parseInt(cells[4].replace(/<[^>]+>/g, '').trim(), 10);
          if (!isNaN(rawDist)) dist = rawDist;
        }
        stops.push({
          stopIndex: stops.length,
          stationCode: code,
          stationName: rawName,
          distanceKm: dist,
        });
      }
    }

    if (stops.length > 0) {
      routeCache.set(tNo, stops);
      return stops;
    }
  } catch (_err) {
    // fallback
  }

  // Fallback to mock routes
  const mock = MOCK_ROUTES[tNo];
  if (mock) {
    routeCache.set(tNo, mock);
    return mock;
  }

  return [];
}

/**
 * Resolve whether a vacant berth interval overlaps with passenger journey,
 * clamp to passenger origin/destination, and compute exact coverage.
 *
 * @param {Object} params
 * @param {Array<Object>} params.routeStops
 * @param {string} params.fromCode
 * @param {string} params.toCode
 * @param {string} params.vbFrom
 * @param {string} params.vbTo
 * @returns {{ overlaps: boolean, isFull: boolean, coveragePercent: number, actualFrom: string, actualTo: string, status: string }}
 */
export function resolveJourneyOverlap({ routeStops, fromCode, toCode, vbFrom, vbTo }) {
  const normFrom = (fromCode || '').trim().toUpperCase();
  const normTo = (toCode || '').trim().toUpperCase();
  const normVbFrom = (vbFrom || '').trim().toUpperCase();
  const normVbTo = (vbTo || '').trim().toUpperCase();

  if (!routeStops || routeStops.length === 0) {
    // Direct code matching fallback
    if (normVbFrom === normFrom && normVbTo === normTo) {
      return {
        overlaps: true,
        isFull: true,
        coveragePercent: 100,
        actualFrom: normFrom,
        actualTo: normTo,
        status: 'FULL_JOURNEY',
      };
    }
    if (normVbFrom === normFrom) {
      return {
        overlaps: true,
        isFull: false,
        coveragePercent: 70,
        actualFrom: normFrom,
        actualTo: normVbTo,
        status: 'PARTIAL_JOURNEY',
      };
    }
    if (normVbTo === normTo) {
      return {
        overlaps: true,
        isFull: false,
        coveragePercent: 60,
        actualFrom: normVbFrom,
        actualTo: normTo,
        status: 'PARTIAL_JOURNEY',
      };
    }
    return {
      overlaps: false,
      isFull: false,
      coveragePercent: 0,
      actualFrom: normVbFrom,
      actualTo: normVbTo,
      status: 'UNAVAILABLE',
    };
  }

  const stnIdx = new Map();
  routeStops.forEach((s) => stnIdx.set(s.stationCode, s.stopIndex));

  // Resolve passenger origin index (with terminal cluster support)
  let fromIdx = stnIdx.get(normFrom);
  if (fromIdx === undefined) {
    const cluster = TERMINAL_CLUSTERS[normFrom] || [];
    for (const alt of cluster) {
      if (stnIdx.has(alt)) { fromIdx = stnIdx.get(alt); break; }
    }
  }

  // Resolve passenger destination index (with terminal cluster support)
  let toIdx = stnIdx.get(normTo);
  if (toIdx === undefined) {
    const cluster = TERMINAL_CLUSTERS[normTo] || [];
    for (const alt of cluster) {
      if (stnIdx.has(alt)) { toIdx = stnIdx.get(alt); break; }
    }
  }

  if (fromIdx === undefined || toIdx === undefined || fromIdx >= toIdx) {
    return {
      overlaps: false,
      isFull: false,
      coveragePercent: 0,
      actualFrom: normVbFrom,
      actualTo: normVbTo,
      status: 'UNAVAILABLE',
    };
  }

  // Resolve berth vacancy start/end with boundary fallbacks
  let vStart = stnIdx.get(normVbFrom);
  if (vStart === undefined) {
    if (normVbFrom === normFrom) {
      vStart = fromIdx;
    } else if (routeStops[0] && normVbFrom === routeStops[0].stationCode) {
      vStart = 0;
    } else {
      const cluster = TERMINAL_CLUSTERS[normVbFrom] || [];
      for (const alt of cluster) {
        if (stnIdx.has(alt)) { vStart = stnIdx.get(alt); break; }
      }
    }
  }

  let vEnd = stnIdx.get(normVbTo);
  if (vEnd === undefined) {
    if (normVbTo === normTo) {
      vEnd = toIdx;
    } else if (routeStops[routeStops.length - 1] && normVbTo === routeStops[routeStops.length - 1].stationCode) {
      vEnd = routeStops.length - 1;
    } else {
      const cluster = TERMINAL_CLUSTERS[normVbTo] || [];
      for (const alt of cluster) {
        if (stnIdx.has(alt)) { vEnd = stnIdx.get(alt); break; }
      }
    }
  }

  if (vStart === undefined || vEnd === undefined || vStart >= vEnd) {
    // If vacancy stations cannot be positioned along the route, check direct origin/destination match
    if (normVbFrom === normFrom && normVbTo === normTo) {
      return {
        overlaps: true,
        isFull: true,
        coveragePercent: 100,
        actualFrom: normFrom,
        actualTo: normTo,
        status: 'FULL_JOURNEY',
      };
    }
    return {
      overlaps: false,
      isFull: false,
      coveragePercent: 0,
      actualFrom: normVbFrom,
      actualTo: normVbTo,
      status: 'UNAVAILABLE',
    };
  }

  // Calculate segment overlap between berth availability [vStart, vEnd] and passenger journey [fromIdx, toIdx]
  const overlapStart = Math.max(vStart, fromIdx);
  const overlapEnd = Math.min(vEnd, toIdx);

  if (overlapStart >= overlapEnd) {
    return {
      overlaps: false,
      isFull: false,
      coveragePercent: 0,
      actualFrom: normVbFrom,
      actualTo: normVbTo,
      status: 'UNAVAILABLE',
    };
  }

  const isFull = vStart <= fromIdx && vEnd >= toIdx;
  const isBoardingSegment = vStart <= fromIdx;
  const isDestinationSegment = vEnd >= toIdx;
  const stopFrom = Array.isArray(routeStops) ? routeStops[overlapStart] : null;
  const stopTo = Array.isArray(routeStops) ? routeStops[overlapEnd] : null;
  const actualFrom = stopFrom?.stationCode || normFrom;
  const actualTo = stopTo?.stationCode || (isFull ? normTo : normVbTo);
  const journeySpan = Math.max(1, toIdx - fromIdx);
  const overlapSpan = overlapEnd - overlapStart;
  const coveragePercent = isFull
    ? 100
    : Math.max(5, Math.min(99, Math.round((overlapSpan / journeySpan) * 100)));

  let segmentDistanceKm = 0;
  if (stopFrom && stopTo && typeof stopFrom.distanceKm === 'number' && typeof stopTo.distanceKm === 'number') {
    segmentDistanceKm = Math.abs(stopTo.distanceKm - stopFrom.distanceKm);
  }

  return {
    overlaps: true,
    isFull,
    isBoardingSegment,
    isDestinationSegment,
    coveragePercent,
    actualFrom,
    actualTo,
    fromStationName: stopFrom?.stationName || actualFrom,
    toStationName: stopTo?.stationName || actualTo,
    fromStopIndex: overlapStart,
    toStopIndex: overlapEnd,
    segmentDistanceKm,
    status: isFull ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY',
  };
}
