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
import { fetchLiveCoachComposition, fetchLiveTrainComposition } from './irctcLive.service.js';

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
  const normClass = travelClass ? travelClass.toUpperCase().trim() : getCoachClass(normCoach);

  const provider = getRailwayProvider();
  let routeData = await provider.getTrainRoute(normTrain);

  if (!routeData || !routeData.route || routeData.route.length === 0) {
    try {
      const liveComp = await fetchLiveTrainComposition(normTrain, journeyDate, from || 'NDLS');
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
    throw new ApiError('TRAIN_NOT_FOUND', `Train ${normTrain} was not found on active schedule.`, 404);
  }

  const { train, route } = routeData;

  const fromStation = from ? from.toUpperCase().trim() : route[0].stationCode;
  const toStation = to ? to.toUpperCase().trim() : route[route.length - 1].stationCode;

  const journey = resolveJourneySegment(route, fromStation, toStation);
  if (!journey.valid) {
    throw new ApiError(
      'INVALID_JOURNEY_SEGMENT',
      `Stations ${fromStation} → ${toStation} are not valid sequential stops on train ${normTrain}.`,
      400
    );
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
    try {
      try {
        const liveComp = await fetchLiveTrainComposition(normTrain, journeyDate, fromStation);
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

      if (secondChartTime && avlRemoteForBooking && Array.isArray(route) && route.length > 0) {
        const fromIdx = route.findIndex((s) => s.stationCode === fromStation);
        const remoteIdx = route.findIndex((s) => s.stationCode === avlRemoteForBooking);
        if (fromIdx !== -1 && remoteIdx !== -1 && fromIdx < remoteIdx) {
          isBeforeRemote = true;
        }
      }

      let liveCoach = { success: false };
      if (!isBeforeRemote) {
        liveCoach = await fetchLiveCoachComposition({
          trainNo: normTrain,
          jDate: journeyDate,
          boardingStation: fromStation,
          remoteStation,
          trainSourceStation,
          coach: normCoach,
          cls: normClass,
        });
      }

      if (liveCoach.success && Array.isArray(liveCoach.berths) && liveCoach.berths.length > 0) {
        occupancies = {};
        const liveBerthsList = [];

        // Match IRCTC passenger coach map parity:
        // On LHB Sleeper/3A coaches, IRCTC displays commercial passenger berths up to 63
        // (Bays 1-7: 1..56, Bay 8: 57..63; excluding staff/OBHS berths 64-80).
        let berthsToProcess = liveCoach.berths;
        const is63CapTrain = ['12815', '12816', '12875', '12876', '12819', '12820'].includes(normTrain);
        if (
          is63CapTrain &&
          (normCoach.startsWith('S') || normCoach.startsWith('B'))
        ) {
          berthsToProcess = liveCoach.berths.filter((b) => Number(b.berthNo) <= 63);
        } else if (normCoach.startsWith('A')) {
          berthsToProcess = liveCoach.berths.filter((b) => Number(b.berthNo) <= 54);
        } else if (normCoach.startsWith('H')) {
          berthsToProcess = liveCoach.berths.filter((b) => Number(b.berthNo) <= 24);
        } else if (normCoach.startsWith('S') || normCoach.startsWith('B')) {
          berthsToProcess = liveCoach.berths.filter((b) => Number(b.berthNo) <= 72);
        }

        for (const b of berthsToProcess) {
          const bNum = Number(b.berthNo);
          occupancies[bNum] = [];
          if (Array.isArray(b.bsd)) {
            for (const seg of b.bsd) {
              if (seg.occupancy === true) {
                occupancies[bNum].push({
                  from: seg.from,
                  to: seg.to,
                  quota: seg.quota,
                });
              }
            }
          }

          const code = (b.berthCode || '').toUpperCase().trim();
          const berthType =
            code === 'LB' || code === 'L'
              ? 'LOWER'
              : code === 'MB' || code === 'M'
              ? 'MIDDLE'
              : code === 'UB' || code === 'U'
              ? 'UPPER'
              : code === 'SL' || code === 'R'
              ? 'SIDE_LOWER'
              : code === 'SU' || code === 'P'
              ? 'SIDE_UPPER'
              : 'LOWER';

          const bayNumber = b.cabinCoupe ? Number(b.cabinCoupe) : Math.ceil(bNum / (normClass === '2A' ? 6 : 8));
          const isSide = berthType === 'SIDE_LOWER' || berthType === 'SIDE_UPPER';
          const bayType =
            normClass === '1A'
              ? berthType === 'LOWER' && bNum % 4 <= 2
                ? 'CABIN'
                : 'COUPE'
              : isSide
              ? 'SIDE_BAY'
              : 'MAIN_BAY';

          liveBerthsList.push({
            berthNumber: bNum,
            berthType,
            position: isSide ? berthType : `MAIN_${berthType}`,
            bayNumber,
            bayLabel: `Bay ${bayNumber}`,
            bayType,
            coach: normCoach,
            class: normClass,
          });
        }

        baseBerths = liveBerthsList;
        isLiveFromIrctc = true;
      }
    } catch (_err) {
      isLiveFromIrctc = false;
    }

    if (!isLiveFromIrctc) {
      if (process.env.NODE_ENV === 'test') {
        occupancies = generateDeterministicOccupancies(
          normTrain,
          normCoach,
          journeyDate,
          route,
          baseBerths.length
        );
      } else {
        // In live IRCTC parity, if the chart is not prepared yet, do NOT fabricate fake berth data.
        return {
        trainNumber: normTrain,
        trainName: train.name,
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
        message: `Reservation chart is not prepared yet by IRCTC for Train ${normTrain} on ${journeyDate}. As per Indian Railways rules, the first reservation chart is officially prepared 4 hours before train departure. Please check back 4 hours prior.`,
        summary: {
          totalBerths: baseBerths.length,
          fullJourneyCount: 0,
          partialCount: 0,
          unavailableCount: 0,
          availableTotal: 0,
          vacancyRate: 0,
          byType: {
            '1A': { fullJourney: 0 },
            '2A': { fullJourney: 0 },
            '3A': { fullJourney: 0 },
            'SL': { fullJourney: 0 },
          },
        },
        bays: groupBerthsIntoBays(baseBerths, normClass),
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
  }

    if (isBeforeRemote) {
      classVacantSummary = {
        '1A': 0, '2A': 0, '3A': 0, '3E': 0, 'SL': 0,
      };
    }

    // Evaluate each berth against the passenger journey segment
    const { berths: evaluatedBerths } = evaluateCoachBerths({
      coachBerths: baseBerths,
      coachOccupancies: occupancies,
      routeStops: route,
      fromStation,
      toStation,
      requestedClass: normClass,
    });

    // Add deterministic suitability rationales
    const enrichedBerths = evaluatedBerths.map((b) => {
      if (isBeforeRemote) {
        return {
          ...b,
          status: 'UNAVAILABLE',
          coveragePercent: 0,
          suitabilityReason: `Online booking closed at Second Chart. Vacant berths handed over to Train TTE till ${avlRemoteForBooking}.`,
        };
      }

      let suitabilityReason = '';
      if (b.status === 'FULL_JOURNEY') {
        suitabilityReason = `Fully vacant across your entire travel route from ${fromStation} to ${toStation}.`;
      } else if (b.status === 'PARTIAL_JOURNEY') {
        suitabilityReason = `Vacant from ${b.availableFrom} to ${b.availableTo} (${b.coveragePercent}% coverage). Occupied for remaining stops.`;
      } else {
        const occDetails = b.occupiedSegments
          ? b.occupiedSegments.map((s) => `${s.from}→${s.to}`).join(', ')
          : `${fromStation}→${toStation}`;
        suitabilityReason = `Reserved/Occupied during your travel segment (${occDetails}).`;
      }

      return {
        ...b,
        suitabilityReason,
      };
    });

    // Group berths into bays
    const bays = groupBerthsIntoBays(enrichedBerths, normClass);

    // Calculate summary statistics
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

    for (const b of enrichedBerths) {
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

    const totalBerths = enrichedBerths.length;
    const availableTotal = fullJourneyCount + partialCount;
    const vacancyRate = Math.round((availableTotal / totalBerths) * 100);

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
          '1A': { fullJourney: classVacantSummary ? classVacantSummary['1A'] : (normClass === '1A' ? fullJourneyCount : 0) },
          '2A': { fullJourney: classVacantSummary ? classVacantSummary['2A'] : (normClass === '2A' ? fullJourneyCount : 0) },
          '3A': { fullJourney: classVacantSummary ? classVacantSummary['3A'] : (normClass === '3A' ? fullJourneyCount : 0) },
          '3E': { fullJourney: classVacantSummary ? classVacantSummary['3E'] : (normClass === '3E' ? fullJourneyCount : 0) },
          'SL': { fullJourney: classVacantSummary ? classVacantSummary['SL'] : (normClass === 'SL' ? fullJourneyCount : 0) },
        },
      },
      bays,
      berths: enrichedBerths,
      availableCoaches,
      routeStops: route.map((s) => ({
        stationCode: s.stationCode,
        stationName: s.stationName,
        stopIndex: s.stopIndex,
        arrival: s.arrival,
        departure: s.departure,
        distanceKm: s.distanceKm,
      })),
      source: isLiveFromIrctc ? 'live' : (process.env.NODE_ENV === 'test' ? 'demo' : 'live'),
      isDemo: !isLiveFromIrctc && process.env.NODE_ENV === 'test',
      isLiveChart: isLiveFromIrctc,
      isChartPrepared: isLiveFromIrctc || process.env.NODE_ENV === 'test',
      chartStatus: isLiveFromIrctc ? 'CHART_PREPARED' : (process.env.NODE_ENV === 'test' ? 'CHART_PREPARED' : 'CHART_NOT_PREPARED'),
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
 * @returns {Promise<Object>}
 */
export async function getTrainCoachesSummary(trainNumber) {
  const normTrain = String(trainNumber || '').trim();
  const provider = getRailwayProvider();
  let routeData = await provider.getTrainRoute(normTrain);

  if (!routeData) {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const liveComp = await fetchLiveTrainComposition(normTrain, todayStr, 'NDLS');
      if (liveComp && (liveComp.success || liveComp.trainName)) {
        const availableCoaches = (liveComp.coaches || []).map((c) => c.coachName);
        return {
          trainNumber: normTrain,
          trainName: liveComp.trainName || `Train ${normTrain}`,
          classes: Array.from(new Set((liveComp.coaches || []).map((c) => c.classCode))),
          availableCoaches: availableCoaches.length > 0 ? availableCoaches : ['B1', 'B2', 'B3', 'S1'],
          defaultCoach: availableCoaches[0] || 'B1',
          origin: liveComp.from || 'ORIGIN',
          originName: liveComp.from || 'Origin Station',
          destination: liveComp.to || 'DEST',
          destinationName: liveComp.to || 'Destination Station',
          totalStops: 10,
          source: 'live',
          isDemo: false,
          fetchedAt: new Date().toISOString(),
        };
      }
    } catch (_e) {
      // Train discovery fallback
    }
    throw new ApiError('TRAIN_NOT_FOUND', `Train ${normTrain} was not found on schedule.`, 404);
  }

  const { train, route } = routeData;
  const availableCoaches = getTrainCoaches(normTrain);
  const defaultCoach = availableCoaches[0] || 'B1';

  let source = 'demo';
  let isDemo = true;
  let liveCoachesList = [];
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const liveComp = await fetchLiveTrainComposition(normTrain, todayStr, route[0]?.stationCode || 'BBS');
    if (liveComp && (liveComp.success || liveComp.coaches)) {
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

  return {
    trainNumber: normTrain,
    trainName: train.name,
    classes: train.classes,
    availableCoaches: liveCoachesList.length > 0 ? liveCoachesList.map((c) => c.coachName) : availableCoaches,
    coachesData: liveCoachesList,
    defaultCoach: liveCoachesList[0]?.coachName || defaultCoach,
    origin: route[0]?.stationCode,
    originName: route[0]?.stationName,
    destination: route[route.length - 1]?.stationCode,
    destinationName: route[route.length - 1]?.stationName,
    totalStops: route.length,
    source,
    isDemo,
    fetchedAt: new Date().toISOString(),
  };
}
