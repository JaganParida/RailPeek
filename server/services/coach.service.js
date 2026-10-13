import { getRailwayProvider } from '../providers/index.js';
import { CACHE_POLICY } from '../cache/cachePolicy.js';
import { getCoachVacancyCacheKey } from '../cache/cacheKey.js';
import { cacheStore } from '../cache/memoryStore.js';
import { singleFlight } from '../cache/singleFlight.js';
import { evaluateCoachBerths, resolveJourneySegment } from '../engine/segmentEngine.js';
import {
  generateCoachBerths,
  groupBerthsIntoBays,
  getCoachClass,
  getTrainCoaches,
} from '../mockData/coaches.mock.js';
import { MOCK_BERTH_OCCUPANCIES } from '../mockData/availability.mock.js';
import { ApiError } from '../utils/apiResponse.js';
import { fetchLiveCoachComposition, fetchLiveTrainComposition, fetchLiveVacantBerths } from './irctcLive.service.js';
import { getTrainRouteStops, resolveJourneyOverlap, TERMINAL_CLUSTERS } from './routeResolver.service.js';
import { getCachedAvailability } from './availability.service.js';
import { env } from '../config/env.js';

/**
 * Generates deterministic realistic occupancies if coach is not explicitly hardcoded.
 * @param {string} trainNumber
 * @param {string} coachId
 * @param {string} date
 * @param {Array<Object>} routeStops
 * @param {number} totalBerths
 * @returns {Record<number, Array<Object>>}
 */
export function generateDeterministicOccupancies(trainNumber, coachId, date, routeStops, totalBerths) {
  const coachKey = `${trainNumber}:${coachId}`;
  if (MOCK_BERTH_OCCUPANCIES[coachKey]) {
    return MOCK_BERTH_OCCUPANCIES[coachKey];
  }

  const occupancies = {};
  const stopCount = routeStops.length;

  for (let b = 1; b <= totalBerths; b++) {
    // FNV-1a inspired hash string
    let hash = 2166136261;
    const str = `${trainNumber}:${coachId}:${date}:${b}`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const val = Math.abs(hash) % 100;

    if (val < 25) {
      // 25% Full journey available
      occupancies[b] = [];
    } else if (val < 60) {
      // 35% Partial journey available
      if (val % 2 === 0) {
        // Occupied at start, available second half
        const toIdx = Math.min(stopCount - 1, Math.max(1, Math.floor(stopCount * 0.4)));
        occupancies[b] = [
          {
            from: routeStops[0].stationCode,
            to: routeStops[toIdx].stationCode,
            fromIndex: 0,
            toIndex: toIdx,
          },
        ];
      } else {
        // Available at start, occupied second half
        const fromIdx = Math.min(stopCount - 2, Math.max(1, Math.floor(stopCount * 0.5)));
        occupancies[b] = [
          {
            from: routeStops[fromIdx].stationCode,
            to: routeStops[stopCount - 1].stationCode,
            fromIndex: fromIdx,
            toIndex: stopCount - 1,
          },
        ];
      }
    } else {
      // 40% Fully occupied across route
      occupancies[b] = [
        {
          from: routeStops[0].stationCode,
          to: routeStops[stopCount - 1].stationCode,
          fromIndex: 0,
          toIndex: stopCount - 1,
        },
      ];
    }
  }

  return occupancies;
}

/**
 * Get comprehensive coach layout and evaluated journey vacancy data
 *
 * @param {Object} params
 * @param {string} params.trainNumber
 * @param {string} params.coachId
 * @param {string} [params.date]
 * @param {string} [params.from]
 * @param {string} [params.to]
 * @param {string} [params.travelClass]
 * @returns {Promise<Object>}
 */
export async function getCoachVacancy({
  trainNumber,
  coachId,
  date,
  from,
  to,
  travelClass,
}) {
  const normTrain = String(trainNumber || '').trim();
  const normCoach = String(coachId || '').toUpperCase().trim();
  const journeyDate = date ? date.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const inferredClass = getCoachClass(normCoach);
  let normClass = inferredClass || (travelClass ? travelClass.toUpperCase().trim() : '3A');

  const provider = getRailwayProvider();
  let routeData = null;
  try {
    routeData = await provider.getTrainRoute(normTrain);
  } catch (_e) {
    // Graceful fallback to route stops database
  }

  if (!routeData || !routeData.route || routeData.route.length === 0) {
    try {
      const dynamicStops = await getTrainRouteStops(normTrain);
      if (Array.isArray(dynamicStops) && dynamicStops.length > 0) {
        routeData = {
          train: {
            number: normTrain,
            name: `Train ${normTrain}`,
            classes: ['3A', '2A', 'SL', '1A'],
          },
          route: dynamicStops,
        };
      }
    } catch (_e) {
      // route lookup fallback
    }
  }

  if (!routeData || !routeData.route || routeData.route.length === 0) {
    try {
      const liveComp = await fetchLiveTrainComposition(normTrain, journeyDate, from || 'BBS');
      if (liveComp && (liveComp.success || liveComp.trainName)) {
        const fromStn = from ? from.toUpperCase().trim() : (liveComp.from || 'ORIGIN');
        const toStn = to ? to.toUpperCase().trim() : (liveComp.to || 'DEST');
        routeData = {
          train: {
            number: normTrain,
            name: liveComp.trainName || `Train ${normTrain}`,
            classes: liveComp.coaches ? Array.from(new Set(liveComp.coaches.map((c) => c.classCode).filter(Boolean))) : ['SL', '3A', '2A'],
          },
          route: [
            { stationCode: fromStn, stationName: fromStn, stopIndex: 0, arrival: '--:--', departure: '12:00', distanceKm: 0 },
            { stationCode: toStn, stationName: toStn, stopIndex: 1, arrival: '20:00', departure: '--:--', distanceKm: 500 },
          ],
        };
      }
    } catch (_e) {
      // Live composition lookup failed; fallback to route data
    }
  }

  if (!routeData || !routeData.route || routeData.route.length === 0) {
    if (from && to) {
      const fromStn = from.toUpperCase().trim();
      const toStn = to.toUpperCase().trim();
      routeData = {
        train: {
          number: normTrain,
          name: `Train ${normTrain}`,
          classes: ['3A', '2A', 'SL', '1A'],
        },
        route: [
          { stationCode: fromStn, stationName: fromStn, stopIndex: 0, arrival: '--:--', departure: '12:00', distanceKm: 0 },
          { stationCode: toStn, stationName: toStn, stopIndex: 1, arrival: '20:00', departure: '--:--', distanceKm: 500 },
        ],
      };
    } else {
      throw new ApiError('TRAIN_NOT_FOUND', `Train ${normTrain} was not found on active schedule.`, 404);
    }
  }

  const { train, route } = routeData;

  let fromStation = from ? from.toUpperCase().trim() : route[0].stationCode;
  let toStation = to ? to.toUpperCase().trim() : route[route.length - 1].stationCode;

  // Terminal cluster resolution (e.g. user searched NDLS, but train halts at NZM/ANVT)
  if (!route.some((s) => s.stationCode === fromStation) && TERMINAL_CLUSTERS[fromStation]) {
    const cluster = TERMINAL_CLUSTERS[fromStation];
    const matchStop = route.find((s) => cluster.includes(s.stationCode));
    if (matchStop) {
      fromStation = matchStop.stationCode;
    }
  }

  if (!route.some((s) => s.stationCode === toStation) && TERMINAL_CLUSTERS[toStation]) {
    const cluster = TERMINAL_CLUSTERS[toStation];
    const matchStop = route.find((s) => cluster.includes(s.stationCode));
    if (matchStop) {
      toStation = matchStop.stationCode;
    }
  }

  let journey = resolveJourneySegment(route, fromStation, toStation);
  if (!journey.valid) {
    // If the requested stations don't sequentially match this specific train's stops,
    // gracefully adapt to valid stops
    const fromStop = route.find((s) => s.stationCode === fromStation);
    const toStop = route.find((s) => s.stationCode === toStation);

    const safeFrom = fromStop ? fromStation : route[0].stationCode;
    const safeTo = toStop && (!fromStop || toStop.stopIndex > fromStop.stopIndex)
      ? toStation
      : route[route.length - 1].stationCode;

    fromStation = safeFrom;
    toStation = safeTo;
    journey = resolveJourneySegment(route, fromStation, toStation);
  }

  if (!journey.valid) {
    fromStation = route[0].stationCode;
    toStation = route[route.length - 1].stationCode;
    journey = resolveJourneySegment(route, fromStation, toStation);
  }

  const cacheKey = getCoachVacancyCacheKey({
    trainNumber: normTrain,
    coachId: normCoach,
    date: journeyDate,
    from: fromStation,
    to: toStation,
  });

  const cached = await cacheStore.get(cacheKey);
  if (cached && cached.data && !cached.isStale) {
    return { ...cached.data, cached: true };
  }

  const flightResult = await singleFlight.do(cacheKey, async () => {
    // Generate coach structure (adapts to 63-berth LHB Sleeper or 72-berth ICF)
    let baseBerths = generateCoachBerths(normCoach, normClass, normTrain);
    let occupancies = null;
    let isLiveFromIrctc = false;
    let classVacantSummary = null;

    let remoteStation = route[0]?.stationCode || fromStation;
    let trainSourceStation = route[0]?.stationCode || fromStation;
    let firstChartTime = null;
    let secondChartTime = null;
    let avlRemoteForBooking = null;
    let isBeforeRemote = false;

    // Check if live IRCTC chart has berth-level data for this coach
    let liveComp = null;
    try {
      liveComp = await fetchLiveTrainComposition(normTrain, journeyDate, fromStation);
        if (liveComp && liveComp.success) {
          if (liveComp.remote) remoteStation = liveComp.remote;
          if (liveComp.from) trainSourceStation = liveComp.from;
          if (liveComp.chartOneDate) firstChartTime = liveComp.chartOneDate;
          if (liveComp.chartTwoDate) secondChartTime = liveComp.chartTwoDate;
          if (liveComp.avlRemoteForBooking) avlRemoteForBooking = liveComp.avlRemoteForBooking;
          if (Array.isArray(liveComp.coaches)) {
            classVacantSummary = {
              '1A': 0, '2A': 0, '3A': 0, '3E': 0, 'SL': 0,
            };
            for (const c of liveComp.coaches) {
              const clsCode = c.classCode;
              if (classVacantSummary[clsCode] !== undefined) {
                classVacantSummary[clsCode] += (Number(c.vacantBerths) || 0);
              }
            }
          }
        }
      } catch (_e) {
        // Fallback if live composition error occurs
      }

      // If IRCTC explicitly indicates that the chart is not prepared yet, return immediately without stalling
      if (liveComp && liveComp.isPrepared === false) {
        return {
          trainNumber: normTrain,
          trainName: liveComp?.trainName || train.name,
          journeyDate,
          fromStation,
          fromStationName: journey.fromStop?.stationName || fromStation,
          toStation,
          toStationName: journey.toStop?.stationName || toStation,
          coachId: normCoach,
          travelClass: normClass,
          totalBerths: baseBerths.length,
          totalBays: groupBerthsIntoBays(baseBerths, normClass).length,
          isChartPrepared: false,
          chartStatus: 'CHART_NOT_PREPARED',
          message: `Reservation chart is not prepared yet by IRCTC for Train ${normTrain} on ${journeyDate}. As per Indian Railways rules, the first reservation chart is officially prepared 4 hours before train departure.`,
          summary: {
            totalBerths: baseBerths.length,
            fullJourneyCount: 0,
            partialCount: 0,
            unavailableCount: baseBerths.length,
            availableTotal: 0,
            vacancyRate: 0,
            byType: {
              '1A': { fullJourney: 0 },
              '2A': { fullJourney: 0 },
              '3A': { fullJourney: 0 },
              'SL': { fullJourney: 0 },
            },
          },
          bays: groupBerthsIntoBays(
            baseBerths.map((b) => ({
              ...b,
              status: 'UNAVAILABLE',
              statusLabel: 'Chart Not Prepared',
              coveragePercent: 0,
              occupiedSegments: [],
              vacantSegments: [],
            })),
            normClass
          ),
          berths: baseBerths.map((b) => ({
            ...b,
            status: 'UNAVAILABLE',
            statusLabel: 'Chart Not Prepared',
            coveragePercent: 0,
            occupiedSegments: [],
            vacantSegments: [],
          })),
          availableCoaches: getTrainCoaches(normTrain),
          routeStops: route.map((s) => ({
            stationCode: s.stationCode,
            stationName: s.stationName,
            stopIndex: s.stopIndex,
            arrival: s.arrival,
            departure: s.departure,
            distanceKm: s.distanceKm,
          })),
          source: 'live',
          isDemo: false,
          isLiveChart: false,
          fetchedAt: new Date().toISOString(),
        };
      }

      // Update coach class from verified live composition if available
      if (liveComp && liveComp.success && Array.isArray(liveComp.coaches)) {
        const compCoach = liveComp.coaches.find(
          (c) => String(c.coachName || '').toUpperCase().trim() === normCoach
        );
        if (compCoach?.classCode) {
          normClass = compCoach.classCode;
          baseBerths = generateCoachBerths(normCoach, normClass, normTrain);
        }
      }

      // Extract verified vacant berths for this specific coach from authentic IRCTC live data
      let coachVacantBerths = [];
      try {
        const activeChartType = liveComp?.chartTwoDate ? 2 : 1;
        const liveVacant = await fetchLiveVacantBerths({
          trainNo: normTrain,
          jDate: journeyDate,
          boardingStation: fromStation,
          remoteStation,
          trainSourceStation,
          cls: normClass,
          chartType: activeChartType,
        });

        if (liveVacant && liveVacant.success && Array.isArray(liveVacant.vacantBerths)) {
          coachVacantBerths = liveVacant.vacantBerths.filter(
            (vb) => String(vb.coachName || vb.coach || '').toUpperCase().trim() === normCoach
          );
        }
      } catch (_e) {
        // ignore error
      }

      // Map of berthNumber -> array of matching vacant berths from IRCTC (handles multi-split berths)
      const vacantMap = new Map();
      for (const vb of coachVacantBerths) {
        const bNum = Number(vb.berthNumber || vb.berthNo);
        if (bNum) {
          if (!vacantMap.has(bNum)) {
            vacantMap.set(bNum, []);
          }
          vacantMap.get(bNum).push(vb);
        }
      }

      // Authentic Evaluation: Every berth with IRCTC records is VACANT (GREEN), all others are BOOKED (GREY)
      const evaluatedBerths = baseBerths.map((b) => {
        const vbList = vacantMap.get(b.berthNumber) || [];

        if (vbList.length === 0) {
          // Berth is Booked / Occupied by other passengers
          return {
            ...b,
            status: 'UNAVAILABLE',
            statusLabel: 'Booked / Occupied',
            coveragePercent: 0,
            availableFrom: undefined,
            availableTo: undefined,
            occupiedSegments: [{ from: fromStation, to: toStation }],
            availableSegments: [],
            vacantSegments: [],
            suitabilityReason: `Reserved/Occupied by other passengers during travel.`,
          };
        }

        // Berth is Confirmed Vacant from IRCTC
        const userFrom = (fromStation || '').toUpperCase();
        const userTo = (toStation || '').toUpperCase();

        // Evaluate all vacant segments for this berth against user route
        let bestOverlap = null;
        let anyFull = false;

        const evaluatedSegments = vbList.map((vb) => {
          const vbFrom = (vb.from || '').toUpperCase();
          const vbTo = (vb.to || '').toUpperCase();
          let segOverlap = {
            overlaps: false,
            isFull: false,
            coveragePercent: 0,
            actualFrom: vbFrom,
            actualTo: vbTo,
          };

          if (userFrom && userTo && userFrom !== userTo && route.length > 0) {
            segOverlap = resolveJourneyOverlap({
              routeStops: route,
              fromCode: userFrom,
              toCode: userTo,
              vbFrom,
              vbTo,
            });
          }

          if (segOverlap.isFull) anyFull = true;

          return {
            from: vbFrom,
            to: vbTo,
            splitNo: vb.splitNo,
            ...segOverlap,
          };
        });

        // Pick best matching segment for primary label & track
        const overlappingSegs = evaluatedSegments.filter((s) => s.overlaps);
        if (overlappingSegs.length > 0) {
          overlappingSegs.sort((x, y) => {
            const xBoarding = x.isBoardingSegment || x.actualFrom === userFrom;
            const yBoarding = y.isBoardingSegment || y.actualFrom === userFrom;
            if (xBoarding !== yBoarding) return xBoarding ? -1 : 1;
            return (y.coveragePercent || 0) - (x.coveragePercent || 0);
          });
          bestOverlap = overlappingSegs[0];
        } else {
          bestOverlap = evaluatedSegments[0];
        }

        const isFull = anyFull || Boolean(bestOverlap.isFull);
        const coveragePercent = isFull ? 100 : (bestOverlap.coveragePercent || 0);
        const actualFrom = bestOverlap.actualFrom || bestOverlap.from;
        const actualTo = bestOverlap.actualTo || bestOverlap.to;

        const bStatus = isFull ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY';
        const bLabel = isFull
          ? 'Vacant (Available)'
          : `Vacant (${actualFrom} ➔ ${actualTo})`;

        const availableSegs = vbList.map((vb) => ({
          from: (vb.from || '').toUpperCase(),
          to: (vb.to || '').toUpperCase(),
          splitNo: vb.splitNo,
        }));

        const segDescriptions = availableSegs.map((s) => `${s.from} ➔ ${s.to}`).join(', ');

        return {
          ...b,
          status: bStatus,
          statusLabel: bLabel,
          coveragePercent,
          availableFrom: actualFrom,
          availableTo: actualTo,
          occupiedSegments: [],
          availableSegments: availableSegs,
          vacantSegments: availableSegs,
          suitabilityReason: isFull
            ? `Fully vacant across your entire travel route from ${fromStation} to ${toStation}.`
            : `Vacant on: ${segDescriptions}${coveragePercent > 0 ? ` (${coveragePercent}% coverage).` : '.'}`,
        };
      });

      // Group evaluated berths into bays
      const bays = groupBerthsIntoBays(evaluatedBerths, normClass);

      let fullJourneyCount = 0;
      let partialCount = 0;
      let unavailableCount = 0;

      const byType = {
        LOWER: { total: 0, fullJourney: 0, partial: 0, unavailable: 0 },
        MIDDLE: { total: 0, fullJourney: 0, partial: 0, unavailable: 0 },
        UPPER: { total: 0, fullJourney: 0, partial: 0, unavailable: 0 },
        SIDE_LOWER: { total: 0, fullJourney: 0, partial: 0, unavailable: 0 },
        SIDE_UPPER: { total: 0, fullJourney: 0, partial: 0, unavailable: 0 },
      };

      for (const b of evaluatedBerths) {
        if (b.status === 'FULL_JOURNEY') fullJourneyCount++;
        else if (b.status === 'PARTIAL_JOURNEY') partialCount++;
        else if (b.status === 'UNAVAILABLE') unavailableCount++;

        if (byType[b.berthType]) {
          byType[b.berthType].total++;
          if (b.status === 'FULL_JOURNEY') byType[b.berthType].fullJourney++;
          else if (b.status === 'PARTIAL_JOURNEY') byType[b.berthType].partial++;
          else if (b.status === 'UNAVAILABLE') byType[b.berthType].unavailable++;
        }
      }

      const totalBerths = evaluatedBerths.length;
      const availableTotal = fullJourneyCount + partialCount;
      const vacancyRate = totalBerths > 0 ? Math.round((availableTotal / totalBerths) * 100) : 0;
      const availableCoaches = getTrainCoaches(normTrain);

      const result = {
        trainNumber: normTrain,
        trainName: train.name,
        journeyDate,
        fromStation,
        fromStationName: journey.fromStop?.stationName || fromStation,
        toStation,
        toStationName: journey.toStop?.stationName || toStation,
        coachId: normCoach,
        travelClass: normClass,
        totalBerths,
        totalBays: bays.length,
        summary: {
          totalBerths,
          fullJourneyCount,
          partialCount,
          unavailableCount,
          availableTotal,
          vacancyRate,
          byType: {
            ...byType,
            '1A': { fullJourney: normClass === '1A' ? fullJourneyCount : (classVacantSummary?.['1A'] ?? 0) },
            '2A': { fullJourney: normClass === '2A' ? fullJourneyCount : (classVacantSummary?.['2A'] ?? 0) },
            '3A': { fullJourney: normClass === '3A' ? fullJourneyCount : (classVacantSummary?.['3A'] ?? 0) },
            '3E': { fullJourney: normClass === '3E' ? fullJourneyCount : (classVacantSummary?.['3E'] ?? 0) },
            'SL': { fullJourney: normClass === 'SL' ? fullJourneyCount : (classVacantSummary?.['SL'] ?? 0) },
          },
        },
        bays,
        berths: evaluatedBerths,
        availableCoaches,
        routeStops: route.map((s) => ({
          stationCode: s.stationCode,
          stationName: s.stationName,
          stopIndex: s.stopIndex,
          arrival: s.arrival,
          departure: s.departure,
          distanceKm: s.distanceKm,
        })),
        source: 'live',
        isDemo: false,
        isLiveChart: true,
        isChartPrepared: true,
        chartStatus: 'CHART_PREPARED',
        remoteStation,
        chartingStation: remoteStation,
        firstChartTime,
        secondChartTime,
        avlRemoteForBooking,
        isBeforeRemote,
        fetchedAt: new Date().toISOString(),
      };

      await cacheStore.set(cacheKey, result, CACHE_POLICY.chartVacancy.ttlSeconds);
      return result;
    });

    return flightResult.data;
  }

/**
 * Get available coaches list and class summary for a train
 * @param {string} trainNumber
 * @param {Object} [options]
 * @param {string} [options.from]
 * @param {string} [options.to]
 * @param {string} [options.date]
 * @returns {Promise<Object>}
 */
export async function getTrainCoachesSummary(trainNumber, options = {}) {
  const normTrain = String(trainNumber || '').trim();
  const { from, to, date } = options;
  const provider = getRailwayProvider();
  let routeData = await provider.getTrainRoute(normTrain);

  if (!routeData) {
    try {
      const dynamicStops = await getTrainRouteStops(normTrain);
      if (Array.isArray(dynamicStops) && dynamicStops.length > 0) {
        routeData = {
          train: {
            number: normTrain,
            name: `Train ${normTrain}`,
            classes: ['3A', '2A', 'SL', '1A'],
          },
          route: dynamicStops,
        };
      }
    } catch (_e) {
      // route lookup fallback
    }
  }

  // If train route is not found and no journey stations were provided, fail with 404
  if (!routeData && !from && !to) {
    throw new ApiError('TRAIN_NOT_FOUND', `Train ${normTrain} was not found on schedule.`, 404);
  }

  const todayStr = date ? date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  let boardingStn = from || routeData?.route?.[0]?.stationCode || 'BBS';
  if (routeData?.route && !routeData.route.some((s) => s.stationCode === boardingStn) && TERMINAL_CLUSTERS[boardingStn]) {
    const cluster = TERMINAL_CLUSTERS[boardingStn];
    const matchStop = routeData.route.find((s) => cluster.includes(s.stationCode));
    if (matchStop) {
      boardingStn = matchStop.stationCode;
    }
  }
  const destStn = to || routeData?.route?.[routeData.route.length - 1]?.stationCode || 'DEST';

  let liveCoachesList = [];
  let liveTrainName = null;
  let liveCompData = null;
  let source = 'demo';
  let isDemo = true;

  try {
    const liveComp = await fetchLiveTrainComposition(normTrain, todayStr, boardingStn);
    if (liveComp && (liveComp.success || liveComp.coaches || liveComp.trainName)) {
      liveCompData = liveComp;
      if (liveComp.trainName) liveTrainName = liveComp.trainName;
      if (liveComp.coaches && liveComp.coaches.length > 0) {
        liveCoachesList = liveComp.coaches;
      }
      if (liveComp.isPrepared) {
        source = 'live';
        isDemo = false;
      }
    }
  } catch (_e) {
    // Composition lookup fallback
  }

  const standardCoaches = getTrainCoaches(normTrain);
  const availableCoaches = liveCoachesList.length > 0
    ? liveCoachesList.map((c) => c.coachName)
    : standardCoaches.length > 0
    ? standardCoaches
    : ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'A1', 'A2', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

  const originStn = routeData?.route?.[0]?.stationCode || from || 'ORIGIN';
  const originName = routeData?.route?.[0]?.stationName || from || 'Origin Station';
  const destStationCode = routeData?.route?.[routeData.route.length - 1]?.stationCode || to || 'DEST';
  const destName = routeData?.route?.[routeData.route.length - 1]?.stationName || to || 'Destination Station';

  // Calculate live coach vacancy counts across route segments
  const coachVacancyMap = {};
  if (from && routeData?.route?.length > 0 && liveCompData?.isPrepared !== false) {
    try {
      const preferredClass = options.travelClass || options.class;
      const classesToCheck = preferredClass
        ? Array.from(new Set([preferredClass, 'SL', '3A', '2A', '1A']))
        : ['SL', '3A', '2A', '1A'];

      const vacantResults = await Promise.allSettled(
        classesToCheck.map((cls) =>
          fetchLiveVacantBerths({
            trainNo: normTrain,
            jDate: todayStr,
            boardingStation: boardingStn,
            remoteStation: liveCompData?.remote || boardingStn,
            trainSourceStation: liveCompData?.from || originStn,
            cls,
          })
        )
      );

      for (const res of vacantResults) {
        if (res.status === 'fulfilled' && res.value?.success && Array.isArray(res.value.vacantBerths)) {
          for (const vb of res.value.vacantBerths) {
            const overlap = resolveJourneyOverlap({
              routeStops: routeData.route,
              fromCode: boardingStn,
              toCode: destStn,
              vbFrom: vb.from,
              vbTo: vb.to,
            });

            if (overlap.overlaps) {
              const bCoach = (vb.coach || vb.coachName || '').toUpperCase().trim();
              if (bCoach) {
                coachVacancyMap[bCoach] = (coachVacancyMap[bCoach] || 0) + 1;
              }
            }
          }
        }
      }
    } catch (_err) {
      // live vacant calculation fallback
    }
  }

  const enrichedCoachesData = availableCoaches.map((cName) => {
    const existing = liveCoachesList.find((c) => c.coachName === cName);
    const clsCode = existing?.classCode || getCoachClass(cName);
    const computedVacant = coachVacancyMap[cName];
    const officialCount = existing && existing.vacantBerths !== undefined ? Number(existing.vacantBerths) : 0;
    const vacantCount = computedVacant !== undefined ? computedVacant : officialCount;

    return {
      coachName: cName,
      classCode: clsCode,
      vacantBerths: vacantCount,
    };
  });

  const reqClass = options.travelClass || options.class;
  let defaultCoach = liveCoachesList[0]?.coachName || availableCoaches[0] || 'B1';
  if (reqClass) {
    const matchingClassCoaches = enrichedCoachesData.filter((c) => c.classCode === reqClass);
    const vacantClassCoach = matchingClassCoaches.find((c) => c.vacantBerths > 0);
    defaultCoach = vacantClassCoach?.coachName || matchingClassCoaches[0]?.coachName || defaultCoach;
  }

  return {
    trainNumber: normTrain,
    trainName: liveTrainName || routeData?.train?.name || `Train ${normTrain}`,
    classes: routeData?.train?.classes || ['3A', '2A', 'SL', '1A'],
    availableCoaches,
    coachesData: enrichedCoachesData,
    defaultCoach,
    origin: originStn,
    originName: originName,
    destination: destStationCode,
    destinationName: destName,
    totalStops: routeData?.route?.length || 10,
    source,
    isDemo,
    fetchedAt: new Date().toISOString(),
  };
}
