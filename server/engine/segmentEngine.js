/**
 * RailPeek Deterministic Availability & Segment Overlap Engine
 *
 * Pure, mathematical railway journey segment analysis.
 * Operates on discrete station sequence indexes along a train route.
 *
 * Rules:
 * - 100% Pure JavaScript (ES6+). No TypeScript.
 * - Zero external I/O or network side-effects.
 * - Deterministic status & coverage calculations. Never uses AI.
 */

/**
 * @typedef {Object} RouteStop
 * @property {string} stationCode
 * @property {string} stationName
 * @property {number} stopIndex
 * @property {string} [arrival]
 * @property {string} [departure]
 * @property {number} [distanceKm]
 */

/**
 * @typedef {Object} OccupancyInterval
 * @property {string} [from]
 * @property {string} [to]
 * @property {number} fromIndex
 * @property {number} toIndex
 */

/**
 * @typedef {Object} SegmentSpan
 * @property {string} from - Station code where span starts
 * @property {string} to - Station code where span ends
 * @property {number} fromIndex - Route stop index where span starts
 * @property {number} toIndex - Route stop index where span ends
 * @property {number} stopCount - Number of station hops (toIndex - fromIndex)
 */

/**
 * @typedef {"FULL_JOURNEY" | "PARTIAL_JOURNEY" | "UNAVAILABLE" | "UNKNOWN"} BerthStatus
 */

/**
 * Reason codes for deterministic availability explanation
 */
export const REASON_CODES = {
  FULL_JOURNEY_AVAILABLE: 'FULL_JOURNEY_AVAILABLE',
  PARTIAL_COVERAGE: 'PARTIAL_COVERAGE',
  OCCUPIED_AT_START: 'OCCUPIED_AT_START',
  OCCUPIED_AT_END: 'OCCUPIED_AT_END',
  OCCUPIED_MID_JOURNEY: 'OCCUPIED_MID_JOURNEY',
  OCCUPIED_DURING_JOURNEY: 'OCCUPIED_DURING_JOURNEY',
  STATION_NOT_ON_ROUTE: 'STATION_NOT_ON_ROUTE',
  INVALID_STATION_ORDER: 'INVALID_STATION_ORDER',
  CLASS_MISMATCH: 'CLASS_MISMATCH',
  EMPTY_OCCUPANCY: 'EMPTY_OCCUPANCY',
};

/**
 * Builds a fast lookup map of uppercase station code -> RouteStop
 *
 * @param {RouteStop[]} routeStops
 * @returns {Map<string, RouteStop>}
 */
export function buildStationIndexMap(routeStops) {
  const map = new Map();
  if (!Array.isArray(routeStops)) return map;

  for (const stop of routeStops) {
    if (stop && stop.stationCode) {
      map.set(stop.stationCode.trim().toUpperCase(), stop);
    }
  }

  return map;
}

/**
 * Validates and resolves passenger journey segment boundaries along the route.
 *
 * @param {RouteStop[]} routeStops
 * @param {string} fromStation
 * @param {string} toStation
 * @returns {{
 *   valid: boolean,
 *   reason?: string,
 *   fromStop?: RouteStop,
 *   toStop?: RouteStop,
 *   passengerStart?: number,
 *   passengerEnd?: number,
 *   totalSegments?: number,
 *   distanceKm?: number
 * }}
 */
export function resolveJourneySegment(routeStops, fromStation, toStation) {
  if (!Array.isArray(routeStops) || routeStops.length < 2) {
    return { valid: false, reason: REASON_CODES.STATION_NOT_ON_ROUTE };
  }

  const fromCode = (fromStation || '').trim().toUpperCase();
  const toCode = (toStation || '').trim().toUpperCase();

  if (!fromCode || !toCode) {
    return { valid: false, reason: REASON_CODES.STATION_NOT_ON_ROUTE };
  }

  if (fromCode === toCode) {
    return { valid: false, reason: REASON_CODES.INVALID_STATION_ORDER };
  }

  const stationMap = buildStationIndexMap(routeStops);
  const fromStop = stationMap.get(fromCode);
  const toStop = stationMap.get(toCode);

  if (!fromStop || !toStop) {
    return { valid: false, reason: REASON_CODES.STATION_NOT_ON_ROUTE };
  }

  if (fromStop.stopIndex >= toStop.stopIndex) {
    return { valid: false, reason: REASON_CODES.INVALID_STATION_ORDER };
  }

  const passengerStart = fromStop.stopIndex;
  const passengerEnd = toStop.stopIndex;
  const totalSegments = passengerEnd - passengerStart;
  const distanceKm =
    fromStop.distanceKm !== undefined && toStop.distanceKm !== undefined
      ? Math.max(0, toStop.distanceKm - fromStop.distanceKm)
      : undefined;

  return {
    valid: true,
    fromStop,
    toStop,
    passengerStart,
    passengerEnd,
    totalSegments,
    distanceKm,
  };
}

/**
 * Pure mathematical interval overlap check.
 * Two intervals [startA, endA] and [startB, endB] overlap if and only if:
 *   max(startA, startB) < min(endA, endB)
 *
 * Boundary touches (e.g. endA === startB) do NOT overlap.
 *
 * @param {number} startA
 * @param {number} endA
 * @param {number} startB
 * @param {number} endB
 * @returns {boolean}
 */
export function doIntervalsOverlap(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Computes exact discrete segment coverage for a passenger journey against
 * an array of occupancy intervals.
 *
 * A passenger journey spans discrete hops: passengerStart, passengerStart + 1, ..., passengerEnd - 1.
 * For each hop s, it is occupied if any occupancy interval covers s (fromIndex <= s < toIndex).
 *
 * @param {Object} params
 * @param {number} params.passengerStart
 * @param {number} params.passengerEnd
 * @param {OccupancyInterval[]} params.occupancies
 * @param {RouteStop[]} params.routeStops
 * @param {string} [params.fromStation]
 * @param {string} [params.toStation]
 * @returns {{
 *   status: BerthStatus,
 *   coveragePercent: number,
 *   availableFrom?: string,
 *   availableTo?: string,
 *   availableSegments: SegmentSpan[],
 *   occupiedSegments: SegmentSpan[],
 *   reasons: string[],
 *   isBoardingAvailable: boolean,
 *   isDeboardingAvailable: boolean,
 *   explanation: string
 * }}
 */
export function computeSegmentCoverage({
  passengerStart,
  passengerEnd,
  occupancies = [],
  routeStops,
  fromStation,
  toStation,
}) {
  const totalSegments = passengerEnd - passengerStart;
  if (totalSegments <= 0) {
    return {
      status: 'UNKNOWN',
      coveragePercent: 0,
      availableSegments: [],
      occupiedSegments: [],
      reasons: [REASON_CODES.INVALID_STATION_ORDER],
      isBoardingAvailable: false,
      isDeboardingAvailable: false,
      explanation: 'Invalid station ordering for route.',
    };
  }

  // Build index to station code helper
  const stopIndexMap = new Map();
  for (const stop of routeStops) {
    stopIndexMap.set(stop.stopIndex, stop.stationCode);
  }

  const getStationCode = (idx) => stopIndexMap.get(idx) || `STOP_${idx}`;

  // Initialize discrete segment occupation flags
  // Index s represents the rail segment between stop s and stop s + 1
  const isSegmentOccupied = new Array(totalSegments).fill(false);

  // Normalize station map in case occupancies only provided station codes instead of indices
  const stationMap = buildStationIndexMap(routeStops);

  for (const occ of occupancies) {
    let occStart = occ.from ? stationMap.get(occ.from.toUpperCase())?.stopIndex : undefined;
    let occEnd = occ.to ? stationMap.get(occ.to.toUpperCase())?.stopIndex : undefined;

    if (occStart === undefined) occStart = occ.fromIndex;
    if (occEnd === undefined) occEnd = occ.toIndex;

    // Safety fallback for intermediate halts not present in simplified stop sequences:
    // If occEnd is known to extend into/past the passenger segment, and occStart is unknown,
    // conservatively mark occupied to prevent false vacant berths!
    if (occStart === undefined && occEnd !== undefined && occEnd > passengerStart) {
      occStart = 0;
    }
    if (occEnd === undefined && occStart !== undefined && occStart < passengerEnd) {
      occEnd = routeStops.length - 1;
    }

    if (occStart === undefined || occEnd === undefined || occStart >= occEnd) {
      continue;
    }

    // Mathematical overlap with passenger segment [passengerStart, passengerEnd]
    const clipStart = Math.max(passengerStart, occStart);
    const clipEnd = Math.min(passengerEnd, occEnd);

    if (clipStart < clipEnd) {
      for (let s = clipStart; s < clipEnd; s++) {
        const offset = s - passengerStart;
        if (offset >= 0 && offset < totalSegments) {
          isSegmentOccupied[offset] = true;
        }
      }
    }
  }

  // Count occupied vs free segments
  let occupiedCount = 0;
  for (let i = 0; i < totalSegments; i++) {
    if (isSegmentOccupied[i]) occupiedCount++;
  }

  const freeCount = totalSegments - occupiedCount;
  const coveragePercent = Math.round((freeCount / totalSegments) * 100);

  // Extract contiguous available runs and occupied runs
  const availableSegments = [];
  const occupiedSegments = [];

  let currentRunType = null; // 'AVAILABLE' | 'OCCUPIED'
  let runStartOffset = 0;

  for (let i = 0; i < totalSegments; i++) {
    const isOcc = isSegmentOccupied[i];
    const type = isOcc ? 'OCCUPIED' : 'AVAILABLE';

    if (type !== currentRunType) {
      if (currentRunType !== null) {
        const fromIdx = passengerStart + runStartOffset;
        const toIdx = passengerStart + i;
        const span = {
          from: getStationCode(fromIdx),
          to: getStationCode(toIdx),
          fromIndex: fromIdx,
          toIndex: toIdx,
          stopCount: toIdx - fromIdx,
        };
        if (currentRunType === 'AVAILABLE') {
          availableSegments.push(span);
        } else {
          occupiedSegments.push(span);
        }
      }
      currentRunType = type;
      runStartOffset = i;
    }
  }

  // Push final trailing run
  if (currentRunType !== null) {
    const fromIdx = passengerStart + runStartOffset;
    const toIdx = passengerEnd;
    const span = {
      from: getStationCode(fromIdx),
      to: getStationCode(toIdx),
      fromIndex: fromIdx,
      toIndex: toIdx,
      stopCount: toIdx - fromIdx,
    };
    if (currentRunType === 'AVAILABLE') {
      availableSegments.push(span);
    } else {
      occupiedSegments.push(span);
    }
  }

  const isBoardingAvailable = !isSegmentOccupied[0];
  const isDeboardingAvailable = !isSegmentOccupied[totalSegments - 1];

  let status = 'FULL_JOURNEY';
  let availableFrom = fromStation || getStationCode(passengerStart);
  let availableTo = toStation || getStationCode(passengerEnd);
  const reasons = [];

  if (occupiedCount === 0) {
    // 100% Free
    status = 'FULL_JOURNEY';
    reasons.push(REASON_CODES.FULL_JOURNEY_AVAILABLE);
  } else if (freeCount === 0) {
    // 0% Free
    status = 'UNAVAILABLE';
    availableFrom = undefined;
    availableTo = undefined;
    reasons.push(REASON_CODES.OCCUPIED_DURING_JOURNEY);
  } else {
    // Partial Journey
    status = 'PARTIAL_JOURNEY';
    reasons.push(REASON_CODES.PARTIAL_COVERAGE);

    if (isSegmentOccupied[0]) {
      reasons.push(REASON_CODES.OCCUPIED_AT_START);
    }
    if (isSegmentOccupied[totalSegments - 1]) {
      reasons.push(REASON_CODES.OCCUPIED_AT_END);
    }

    // Check for mid-journey punctures (free at ends but occupied in middle)
    const hasMidConflict = isSegmentOccupied
      .slice(1, totalSegments - 1)
      .some((occ) => occ === true);
    if (hasMidConflict && !isSegmentOccupied[0] && !isSegmentOccupied[totalSegments - 1]) {
      reasons.push(REASON_CODES.OCCUPIED_MID_JOURNEY);
    }

    // Select primary available segment: pick the longest contiguous available span
    if (availableSegments.length > 0) {
      let longestSpan = availableSegments[0];
      for (const span of availableSegments) {
        if (span.stopCount > longestSpan.stopCount) {
          longestSpan = span;
        }
      }
      availableFrom = longestSpan.from;
      availableTo = longestSpan.to;
    }
  }

  // Generate deterministic explanation
  const explanation = generateDeterministicExplanation({
    status,
    coveragePercent,
    availableFrom,
    availableTo,
    fromStation: fromStation || getStationCode(passengerStart),
    toStation: toStation || getStationCode(passengerEnd),
    occupiedSegments,
  });

  return {
    status,
    coveragePercent,
    availableFrom,
    availableTo,
    availableSegments,
    occupiedSegments,
    reasons,
    isBoardingAvailable,
    isDeboardingAvailable,
    explanation,
  };
}

/**
 * Generates an honest, deterministic, human-readable explanation of berth status.
 *
 * @param {Object} params
 * @returns {string}
 */
export function generateDeterministicExplanation({
  status,
  coveragePercent,
  availableFrom,
  availableTo,
  fromStation,
  toStation,
  occupiedSegments,
}) {
  if (status === 'FULL_JOURNEY') {
    return `Available for the complete journey from ${fromStation} to ${toStation} (100% coverage).`;
  }

  if (status === 'UNAVAILABLE') {
    return `Unavailable: Berth is occupied by other passengers throughout your journey from ${fromStation} to ${toStation}.`;
  }

  if (status === 'PARTIAL_JOURNEY') {
    const occupiedSummary = occupiedSegments
      .map((seg) => `${seg.from} to ${seg.to}`)
      .join(', ');

    return `Available for ${coveragePercent}% of your journey from ${availableFrom} to ${availableTo}. Reserved between ${occupiedSummary}.`;
  }

  return 'Berth availability status could not be verified.';
}

/**
 * Evaluates a single berth with its occupancy intervals against a journey segment.
 *
 * @param {Object} params
 * @param {Object} params.berth - Base berth metadata (berthNumber, berthType, coach, class, bayNumber)
 * @param {OccupancyInterval[]} [params.occupancies=[]] - Booked occupancy intervals
 * @param {RouteStop[]} params.routeStops - Complete ordered route stops
 * @param {string} params.fromStation - Boarding station code
 * @param {string} params.toStation - Destination station code
 * @param {string} [params.requestedClass] - Optional class filter
 * @returns {Object} Evaluated berth object with deterministic status and coverage
 */
export function evaluateBerth({
  berth,
  occupancies = [],
  routeStops,
  fromStation,
  toStation,
  requestedClass,
}) {
  const journey = resolveJourneySegment(routeStops, fromStation, toStation);

  if (!journey.valid) {
    return {
      ...berth,
      status: 'UNKNOWN',
      coveragePercent: 0,
      availableFrom: undefined,
      availableTo: undefined,
      availableSegments: [],
      occupiedSegments: [],
      reasons: [journey.reason],
      isBoardingAvailable: false,
      isDeboardingAvailable: false,
      explanation: 'Invalid journey stations or route direction.',
    };
  }

  const coverage = computeSegmentCoverage({
    passengerStart: journey.passengerStart,
    passengerEnd: journey.passengerEnd,
    occupancies,
    routeStops,
    fromStation: journey.fromStop.stationCode,
    toStation: journey.toStop.stationCode,
  });

  const reasons = [...coverage.reasons];
  if (requestedClass && berth.class && requestedClass !== berth.class) {
    reasons.push(REASON_CODES.CLASS_MISMATCH);
  }

  return {
    berthNumber: berth.berthNumber,
    berthType: berth.berthType,
    position: berth.position,
    coach: berth.coach,
    class: berth.class,
    bayNumber: berth.bayNumber,
    status: coverage.status,
    coveragePercent: coverage.coveragePercent,
    availableFrom: coverage.availableFrom,
    availableTo: coverage.availableTo,
    availableSegments: coverage.availableSegments,
    occupiedSegments: coverage.occupiedSegments,
    occupancySegments: occupancies,
    reasons,
    isBoardingAvailable: coverage.isBoardingAvailable,
    isDeboardingAvailable: coverage.isDeboardingAvailable,
    explanation: coverage.explanation,
  };
}

/**
 * Evaluates all berths in a coach and produces coach-level summary statistics.
 *
 * @param {Object} params
 * @param {Object[]} params.coachBerths - Array of berth objects
 * @param {Record<number|string, OccupancyInterval[]>} [params.coachOccupancies={}] - Map of berthNumber -> occupancies
 * @param {RouteStop[]} params.routeStops
 * @param {string} params.fromStation
 * @param {string} params.toStation
 * @param {string} [params.requestedClass]
 * @returns {{
 *   berths: Object[],
 *   summary: {
 *     totalBerths: number,
 *     fullJourneyCount: number,
 *     partialCount: number,
 *     unavailableCount: number,
 *     bestCoveragePercent: number
 *   }
 * }}
 */
export function evaluateCoachBerths({
  coachBerths,
  coachOccupancies = {},
  routeStops,
  fromStation,
  toStation,
  requestedClass,
}) {
  const evaluatedBerths = coachBerths.map((b) => {
    const occupancies = coachOccupancies[b.berthNumber] || [];
    return evaluateBerth({
      berth: b,
      occupancies,
      routeStops,
      fromStation,
      toStation,
      requestedClass,
    });
  });

  let fullJourneyCount = 0;
  let partialCount = 0;
  let unavailableCount = 0;
  let bestCoveragePercent = 0;

  for (const b of evaluatedBerths) {
    if (b.status === 'FULL_JOURNEY') fullJourneyCount++;
    else if (b.status === 'PARTIAL_JOURNEY') partialCount++;
    else if (b.status === 'UNAVAILABLE') unavailableCount++;

    if (b.coveragePercent > bestCoveragePercent) {
      bestCoveragePercent = b.coveragePercent;
    }
  }

  return {
    berths: evaluatedBerths,
    summary: {
      totalBerths: coachBerths.length,
      fullJourneyCount,
      partialCount,
      unavailableCount,
      bestCoveragePercent,
    },
  };
}
