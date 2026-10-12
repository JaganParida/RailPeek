/**
 * DSA-Powered Route Chainer & Connected Itinerary Planner
 *
 * Mathematically analyzes all available segment vacancies on a train to find
 * the optimal connected seat-switch path from Passenger Origin to Destination.
 *
 * Objectives (in priority order):
 * 1. Maximize total distance traveled on confirmed seats.
 * 2. Minimize seat switches (fewer switches = more restful trip).
 * 3. Prioritize longer continuous legs over multiple tiny segments.
 * 4. Pick the highest comfort berth (Side Lower / Lower > Upper > Middle) from available seats.
 * 5. If gap segments exist, provide intelligent, actionable passenger guidance.
 */

export const BERTH_COMFORT_ORDER = {
  SIDE_LOWER: 1,
  SL: 1,
  SIDE_UPPER: 2,
  SU: 2,
  LOWER: 3,
  LB: 3,
  L: 3,
  UPPER: 4,
  UB: 4,
  U: 4,
  MIDDLE: 5,
  MB: 5,
  M: 5,
};

/**
 * Returns comfort rank for a berth (lower number = higher comfort)
 */
export function getBerthComfortRank(seat) {
  if (!seat) return 99;
  const raw = (seat.berthType || seat.berthCode || '').toUpperCase();
  return BERTH_COMFORT_ORDER[raw] ?? 99;
}

/**
 * Sorts berths for a segment to pick the best seat:
 * Best comfort rank -> coach name -> lower berth number
 */
export function pickBestBerth(berths) {
  if (!Array.isArray(berths) || berths.length === 0) return null;

  const sorted = [...berths].sort((a, b) => {
    const rA = getBerthComfortRank(a);
    const rB = getBerthComfortRank(b);
    if (rA !== rB) return rA - rB;

    const coachCmp = (a.coach || '').localeCompare(b.coach || '');
    if (coachCmp !== 0) return coachCmp;

    return (Number(a.berthNumber) || 0) - (Number(b.berthNumber) || 0);
  });

  return sorted[0];
}

/**
 * Computes an optimal connected journey itinerary for a train
 *
 * @param {Object} params
 * @param {Array<Object>} params.segmentGroups - Grouped berths by segment
 * @param {string} params.fromStation - Passenger boarding station code
 * @param {string} params.toStation - Passenger destination station code
 * @param {number} [params.totalTripDistanceKm=0] - Total journey distance
 * @returns {Object|null}
 */
export function computeConnectedItinerary({
  segmentGroups = [],
  fromStation = '',
  toStation = '',
  totalTripDistanceKm = 0,
}) {
  if (!Array.isArray(segmentGroups) || segmentGroups.length === 0) return null;

  const normFrom = (fromStation || '').trim().toUpperCase();
  const normTo = (toStation || '').trim().toUpperCase();

  const candidates = segmentGroups.filter(
    (g) => Array.isArray(g.berths) && g.berths.length > 0
  );
  if (candidates.length === 0) return null;

  // 1. DIRECT FULL-JOURNEY MATCH
  const direct = candidates.find(
    (g) =>
      (g.from === normFrom || g.isBoardingSegment) &&
      (g.to === normTo || g.isDestinationSegment)
  );

  if (direct) {
    const sortedDirectBerths = [...direct.berths].sort(
      (a, b) => getBerthComfortRank(a) - getBerthComfortRank(b)
    );
    const topSeat = sortedDirectBerths[0];
    const coveredKm = direct.distanceKm || totalTripDistanceKm || 0;
    const tripKm = totalTripDistanceKm || coveredKm || 1;

    const items = [
      {
        type: 'SEAT',
        stepNumber: 1,
        isBoarding: true,
        isDestination: true,
        from: direct.from,
        to: direct.to,
        fromName: direct.fromName || direct.from,
        toName: direct.toName || direct.to,
        distanceKm: direct.distanceKm || tripKm,
        seat: topSeat,
        berths: sortedDirectBerths,
        totalSeatsAvailable: direct.berths.length,
        otherSeatsCount: Math.max(0, direct.berths.length - 1),
      },
    ];

    return {
      type: 'DIRECT',
      isDirect: true,
      hasGaps: false,
      gapCount: 0,
      totalCoveredKm: coveredKm,
      totalTripKm: tripKm,
      coveragePercent: Math.min(100, Math.round((coveredKm / tripKm) * 100)) || 100,
      totalSwitches: 0,
      legsCount: 1,
      legs: items.filter((it) => it.type === 'SEAT'),
      items,
    };
  }

  // 2. SEAMLESS MULTI-LEG CHAINS (Zero Gaps)
  const boardingSegs = candidates.filter(
    (g) => g.from === normFrom || g.isBoardingSegment
  );
  const destSegs = candidates.filter(
    (g) => (g.to === normTo || g.isDestinationSegment) && g.from !== normFrom
  );

  // 2A. Seamless 2-Leg Chain
  let bestSeamless2 = null;
  for (const b of boardingSegs) {
    for (const d of destSegs) {
      if (b.to === d.from) {
        const covered = (b.distanceKm || 0) + (d.distanceKm || 0);
        // Scoring favors longer covered distance + berth quality
        const score = covered * 10 - (getBerthComfortRank(b.berths[0]) + getBerthComfortRank(d.berths[0]));
        if (!bestSeamless2 || score > bestSeamless2.score) {
          bestSeamless2 = { b, d, covered, score };
        }
      }
    }
  }

  if (bestSeamless2) {
    const { b, d, covered } = bestSeamless2;
    const tripKm = totalTripDistanceKm || covered || 1;
    const bSorted = [...b.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));
    const dSorted = [...d.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));

    const items = [
      {
        type: 'SEAT',
        stepNumber: 1,
        isBoarding: true,
        isDestination: false,
        from: b.from,
        to: b.to,
        fromName: b.fromName || b.from,
        toName: b.toName || b.to,
        distanceKm: b.distanceKm,
        seat: bSorted[0],
        berths: bSorted,
        totalSeatsAvailable: b.berths.length,
        otherSeatsCount: Math.max(0, b.berths.length - 1),
      },
      {
        type: 'SWITCH',
        station: b.to,
        stationName: b.toName || b.to,
        switchText: `Switch seat at ${b.toName || b.to} (Same Train)`,
      },
      {
        type: 'SEAT',
        stepNumber: 2,
        isBoarding: false,
        isDestination: true,
        from: d.from,
        to: d.to,
        fromName: d.fromName || d.from,
        toName: d.toName || d.to,
        distanceKm: d.distanceKm,
        seat: dSorted[0],
        berths: dSorted,
        totalSeatsAvailable: d.berths.length,
        otherSeatsCount: Math.max(0, d.berths.length - 1),
      },
    ];

    return {
      type: 'CONNECTED_2_LEG',
      isDirect: false,
      hasGaps: false,
      gapCount: 0,
      totalCoveredKm: covered,
      totalTripKm: tripKm,
      coveragePercent: Math.min(100, Math.round((covered / tripKm) * 100)),
      totalSwitches: 1,
      legsCount: 2,
      legs: items.filter((it) => it.type === 'SEAT'),
      transitStations: [b.to],
      items,
    };
  }

  // 2B. Seamless 3-Leg Chain
  let bestSeamless3 = null;
  for (const b of boardingSegs) {
    const mids = candidates.filter((m) => m.from === b.to && m.to !== normTo);
    for (const m of mids) {
      const ends = destSegs.filter((d) => d.from === m.to);
      for (const d of ends) {
        const covered = (b.distanceKm || 0) + (m.distanceKm || 0) + (d.distanceKm || 0);
        const score = covered * 10 - (getBerthComfortRank(b.berths[0]) + getBerthComfortRank(m.berths[0]) + getBerthComfortRank(d.berths[0]));
        if (!bestSeamless3 || score > bestSeamless3.score) {
          bestSeamless3 = { b, m, d, covered, score };
        }
      }
    }
  }

  if (bestSeamless3) {
    const { b, m, d, covered } = bestSeamless3;
    const tripKm = totalTripDistanceKm || covered || 1;
    const bSorted = [...b.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));
    const mSorted = [...m.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));
    const dSorted = [...d.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));

    const items = [
      {
        type: 'SEAT',
        stepNumber: 1,
        isBoarding: true,
        isDestination: false,
        from: b.from,
        to: b.to,
        fromName: b.fromName || b.from,
        toName: b.toName || b.to,
        distanceKm: b.distanceKm,
        seat: bSorted[0],
        berths: bSorted,
        totalSeatsAvailable: b.berths.length,
        otherSeatsCount: Math.max(0, b.berths.length - 1),
      },
      {
        type: 'SWITCH',
        station: b.to,
        stationName: b.toName || b.to,
        switchText: `Switch seat at ${b.toName || b.to} (Same Train)`,
      },
      {
        type: 'SEAT',
        stepNumber: 2,
        isBoarding: false,
        isDestination: false,
        from: m.from,
        to: m.to,
        fromName: m.fromName || m.from,
        toName: m.toName || m.to,
        distanceKm: m.distanceKm,
        seat: mSorted[0],
        berths: mSorted,
        totalSeatsAvailable: m.berths.length,
        otherSeatsCount: Math.max(0, m.berths.length - 1),
      },
      {
        type: 'SWITCH',
        station: m.to,
        stationName: m.toName || m.to,
        switchText: `Switch seat at ${m.toName || m.to} (Same Train)`,
      },
      {
        type: 'SEAT',
        stepNumber: 3,
        isBoarding: false,
        isDestination: true,
        from: d.from,
        to: d.to,
        fromName: d.fromName || d.from,
        toName: d.toName || d.to,
        distanceKm: d.distanceKm,
        seat: dSorted[0],
        berths: dSorted,
        totalSeatsAvailable: d.berths.length,
        otherSeatsCount: Math.max(0, d.berths.length - 1),
      },
    ];

    return {
      type: 'CONNECTED_3_LEG',
      isDirect: false,
      hasGaps: false,
      gapCount: 0,
      totalCoveredKm: covered,
      totalTripKm: tripKm,
      coveragePercent: Math.min(100, Math.round((covered / tripKm) * 100)),
      totalSwitches: 2,
      legsCount: 3,
      legs: items.filter((it) => it.type === 'SEAT'),
      transitStations: [b.to, m.to],
      items,
    };
  }

  // 3. BEST AVAILABLE CHAIN WITH GAP BRIDGING
  // If no 100% seamless chain exists, find the optimal sequence of non-overlapping
  // segments that maximizes total travel distance and inserts intelligent GAP guidance!

  // Sort candidate segments along train direction
  const sortedCandidates = [...candidates].sort((x, y) => {
    if (x.fromStopIndex !== y.fromStopIndex) return x.fromStopIndex - y.fromStopIndex;
    return (y.distanceKm || 0) - (x.distanceKm || 0);
  });

  // Greedy Longest-Segment Chain Builder
  const chosenSegments = [];
  let currentStopIdx = -1;

  for (const seg of sortedCandidates) {
    if (seg.fromStopIndex >= currentStopIdx) {
      chosenSegments.push(seg);
      currentStopIdx = seg.toStopIndex;
      if (chosenSegments.length >= 4) break; // Limit to maximum 4 legs for passenger comfort
    }
  }

  if (chosenSegments.length === 0) return null;

  // Build the complete journey sequence including Seat Legs and Gap Spans
  const items = [];
  let stepCounter = 1;
  let totalCoveredKm = 0;
  let hasGaps = false;

  for (let i = 0; i < chosenSegments.length; i++) {
    const seg = chosenSegments[i];
    const prevSeg = i > 0 ? chosenSegments[i - 1] : null;

    // Check if there is an unreserved gap before this segment
    if (prevSeg && prevSeg.to !== seg.from) {
      hasGaps = true;
      const gapDist = Math.max(50, Math.abs((seg.fromStopIndex - prevSeg.toStopIndex) * 80));
      const isShortGap = gapDist <= 150;

      items.push({
        type: 'GAP',
        from: prevSeg.to,
        to: seg.from,
        fromName: prevSeg.toName || prevSeg.to,
        toName: seg.fromName || seg.from,
        distanceKm: gapDist,
        isShortGap,
        tip: isShortGap
          ? `Short gap without seat (~${gapDist} km): You can remain sitting if the berth stays empty, or ask the on-train TTE for an available seat.`
          : `Unreserved stretch (~${gapDist} km): Speak with the on-train TTE to allocate an empty berth, or travel in the General compartment.`,
      });
    } else if (prevSeg && prevSeg.to === seg.from) {
      // Seamless station switch
      items.push({
        type: 'SWITCH',
        station: prevSeg.to,
        stationName: prevSeg.toName || prevSeg.to,
        switchText: `Switch seat at ${prevSeg.toName || prevSeg.to} (Same Train)`,
      });
    }

    // Add confirmed Seat leg
    const segBerths = [...seg.berths].sort((x, y) => getBerthComfortRank(x) - getBerthComfortRank(y));
    const seat = segBerths[0];
    totalCoveredKm += seg.distanceKm || 0;

    items.push({
      type: 'SEAT',
      stepNumber: stepCounter++,
      isBoarding: seg.from === normFrom || seg.isBoardingSegment,
      isDestination: seg.to === normTo || seg.isDestinationSegment,
      from: seg.from,
      to: seg.to,
      fromName: seg.fromName || seg.from,
      toName: seg.toName || seg.to,
      distanceKm: seg.distanceKm || 0,
      seat,
      berths: segBerths,
      totalSeatsAvailable: seg.berths.length,
      otherSeatsCount: Math.max(0, seg.berths.length - 1),
    });
  }

  const tripKm = totalTripDistanceKm || totalCoveredKm || 1;
  const coveragePercent = Math.min(100, Math.round((totalCoveredKm / tripKm) * 100));
  const seatLegs = items.filter((it) => it.type === 'SEAT');
  const gapItems = items.filter((it) => it.type === 'GAP');

  return {
    type: hasGaps ? 'CHAINED_WITH_GAPS' : `CONNECTED_${seatLegs.length}_LEG`,
    isDirect: false,
    hasGaps,
    gapCount: gapItems.length,
    totalCoveredKm,
    totalTripKm: tripKm,
    coveragePercent,
    totalSwitches: Math.max(0, seatLegs.length - 1),
    legsCount: seatLegs.length,
    legs: seatLegs,
    items,
  };
}
