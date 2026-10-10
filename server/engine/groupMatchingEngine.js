/**
 * RailPeek Group & Family Coach & Bay Matching Engine
 *
 * Deterministic multi-passenger berth clustering and cohesion optimization.
 * Computes exact physical proximity within train coaches based on verified bay layouts.
 *
 * Rules:
 * - 100% Pure JavaScript (ES6+). No TypeScript.
 * - Zero AI hallucinations.
 * - Never claims "nearby" unless verified bay layout distance (|bayA - bayB| <= 1) supports it.
 */

/**
 * Cohesion tiers in descending order of passenger comfort
 */
export const GROUP_COHESION_TIERS = {
  SAME_BAY: 'SAME_BAY',
  ADJACENT_BAYS: 'ADJACENT_BAYS',
  SAME_COACH: 'SAME_COACH',
  SPLIT_COACH: 'SPLIT_COACH',
  INSUFFICIENT_BERTHS: 'INSUFFICIENT_BERTHS',
};

/**
 * Deterministic bonus scores for group proximity
 */
export const GROUP_BONUS_SCORES = {
  SAME_BAY_PER_PAX: 200,
  ADJACENT_BAYS_PER_PAX: 140,
  SAME_COACH_PER_PAX: 80,
  PREFERENCE_MATCH_PER_PAX: 120,
};

/**
 * Reason codes for group allocation explanations
 */
export const GROUP_REASON_CODES = {
  GROUP_SAME_BAY_ALLOCATED: 'GROUP_SAME_BAY_ALLOCATED',
  GROUP_ADJACENT_BAYS_ALLOCATED: 'GROUP_ADJACENT_BAYS_ALLOCATED',
  GROUP_SAME_COACH_ALLOCATED: 'GROUP_SAME_COACH_ALLOCATED',
  GROUP_SPLIT_COACH: 'GROUP_SPLIT_COACH',
  GROUP_BAY_UNAVAILABLE: 'GROUP_BAY_UNAVAILABLE',
  GROUP_COACH_UNAVAILABLE: 'GROUP_COACH_UNAVAILABLE',
  INSUFFICIENT_BERTHS: 'INSUFFICIENT_BERTHS',
};

/**
 * Calculates preference match score between a berth and requested preference
 *
 * @param {Object} berth
 * @param {string} preference - "LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "WINDOW", "ANY"
 * @returns {number}
 */
export function calculateBerthPreferenceMatch(berth, preference = 'ANY') {
  const pref = (preference || 'ANY').toUpperCase();
  if (pref === 'ANY') return 50;
  if (berth.berthType === pref) return 150;
  if (pref === 'WINDOW' && berth.berthType === 'SIDE_LOWER') return 130;
  if (pref === 'AISLE' && berth.berthType === 'SIDE_UPPER') return 100;
  return 0;
}

/**
 * Matches a list of berths to passenger preferences deterministically.
 *
 * @param {Object[]} berths
 * @param {string[]} preferences - Array of preferences per passenger
 * @returns {Object[]} Berths annotated with assigned passenger index and preference match status
 */
export function assignPassengersToBerths(berths, preferences = []) {
  const assigned = [];
  const remainingBerths = [...berths];

  for (let pIdx = 0; pIdx < berths.length; pIdx++) {
    const pref = preferences[pIdx] || preferences[0] || 'ANY';

    // Find best matching berth from remaining
    let bestMatchIdx = 0;
    let highestScore = -1;

    for (let bIdx = 0; bIdx < remainingBerths.length; bIdx++) {
      const score = calculateBerthPreferenceMatch(remainingBerths[bIdx], pref);
      if (score > highestScore) {
        highestScore = score;
        bestMatchIdx = bIdx;
      }
    }

    const matchedBerth = remainingBerths.splice(bestMatchIdx, 1)[0];
    assigned.push({
      ...matchedBerth,
      passengerNumber: pIdx + 1,
      passengerLabel: `Passenger ${pIdx + 1}`,
      requestedPreference: pref,
      preferenceMatched: highestScore > 50,
    });
  }

  return assigned;
}

/**
 * Core Algorithm: Clusters and allocates optimal berths for groups of 1 to 6 passengers.
 *
 * Hierarchy:
 * 1. SAME_BAY: All P passengers in the exact same bay (distance = 0)
 * 2. ADJACENT_BAYS: All P passengers in adjacent bays of same coach (|bay1 - bay2| === 1)
 * 3. SAME_COACH: All P passengers in same coach minimizing bay spread
 * 4. SPLIT_COACH: Dispersed across coaches minimizing number of coaches
 *
 * @param {Object[]} candidateBerths - Array of evaluated berths
 * @param {Object} options
 * @param {number} [options.passengers=1] - 1 to 6
 * @param {string} [options.travelClass="3A"]
 * @param {string} [options.berthPreference="ANY"]
 * @param {string[]} [options.passengerPreferences=[]] - Optional individual preferences
 * @param {boolean} [options.sameBay=false] - Explicit user requirement
 * @param {boolean} [options.sameCoach=true] - Explicit user requirement
 * @returns {{
 *   allocatedBerths: Object[],
 *   cohesion: string,
 *   groupScore: number,
 *   coachList: string[],
 *   bayList: number[],
 *   maxBaySpan: number,
 *   isSameBay: boolean,
 *   isSameCoach: boolean,
 *   userRequestedConstraintMet: boolean,
 *   explanation: string,
 *   highlights: string[],
 *   reasons: string[]
 * }}
 */
export function matchGroupBerths(candidateBerths, options = {}) {
  const passengers = Math.max(1, Math.min(6, options.passengers || 1));
  const {
    travelClass = '3A',
    berthPreference = 'ANY',
    passengerPreferences = [],
    sameBay = false,
    sameCoach = true,
  } = options;

  // Build preference array for all passengers
  const resolvedPreferences = [];
  for (let i = 0; i < passengers; i++) {
    resolvedPreferences.push(passengerPreferences[i] || berthPreference || 'ANY');
  }

  // Filter for usable berths (Full or Partial)
  const availableBerths = (candidateBerths || []).filter((b) => b.status !== 'UNAVAILABLE');

  if (availableBerths.length < passengers) {
    return {
      allocatedBerths: [],
      cohesion: GROUP_COHESION_TIERS.INSUFFICIENT_BERTHS,
      groupScore: 0,
      coachList: [],
      bayList: [],
      maxBaySpan: 0,
      isSameBay: false,
      isSameCoach: false,
      userRequestedConstraintMet: false,
      explanation: `Only ${availableBerths.length} available berths found. At least ${passengers} required.`,
      highlights: ['Insufficient berths for group size'],
      reasons: [GROUP_REASON_CODES.INSUFFICIENT_BERTHS],
    };
  }

  // For 1 passenger: simply find the highest scoring individual berth
  if (passengers === 1) {
    const scored = availableBerths.map((b) => {
      let score = b.status === 'FULL_JOURNEY' ? 1000 : (b.coveragePercent || 0) * 6;
      if (b.class === travelClass) score += 200;
      score += calculateBerthPreferenceMatch(b, resolvedPreferences[0]);
      return { berth: b, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const top = scored[0].berth;
    const assigned = assignPassengersToBerths([top], resolvedPreferences);
    const assignedCoach = top.coach || 'B1';
    const assignedBay = top.bayNumber || 1;
    const berthNum = top.berthNumber || '1';
    const berthType = top.berthType || 'BERTH';

    return {
      allocatedBerths: assigned,
      cohesion: GROUP_COHESION_TIERS.SAME_BAY,
      groupScore: scored[0].score,
      coachList: [assignedCoach],
      bayList: [assignedBay],
      maxBaySpan: 0,
      isSameBay: true,
      isSameCoach: true,
      userRequestedConstraintMet: true,
      explanation: `Berth ${assignedCoach} · #${berthNum} (${berthType}) allocated.`,
      highlights: [`Coach ${assignedCoach} · Bay ${assignedBay}`, `${berthType} Berth`],
      reasons: ['INDIVIDUAL_BERTH_ALLOCATED'],
    };
  }

  // Group berths by Coach and by Bay
  // coachMap: coach -> Map(bayNumber -> berth[])
  const coachMap = new Map();
  for (const b of availableBerths) {
    const cName = b.coach || 'B1';
    const bBay = b.bayNumber || 1;
    if (!coachMap.has(cName)) {
      coachMap.set(cName, new Map());
    }
    const bayMap = coachMap.get(cName);
    if (!bayMap.has(bBay)) {
      bayMap.set(bBay, []);
    }
    bayMap.get(bBay).push(b);
  }

  // ==========================================
  // TIER 1: SAME BAY CHECK
  // ==========================================
  let bestBayCandidate = null;
  let bestBayScore = -1;

  for (const [coach, bayMap] of coachMap.entries()) {
    for (const [bayNum, bayBerths] of bayMap.entries()) {
      if (bayBerths.length >= passengers) {
        // Calculate score for this bay
        let bayScore = 0;
        for (const b of bayBerths.slice(0, passengers)) {
          bayScore += b.status === 'FULL_JOURNEY' ? 1000 : (b.coveragePercent || 0) * 6;
          if (b.class === travelClass) bayScore += 200;
        }
        bayScore += GROUP_BONUS_SCORES.SAME_BAY_PER_PAX * passengers;

        if (bayScore > bestBayScore) {
          bestBayScore = bayScore;
          bestBayCandidate = {
            coach: coach || 'B1',
            bayNumber: bayNum || 1,
            berths: bayBerths.slice(0, passengers),
            score: bayScore,
          };
        }
      }
    }
  }

  if (bestBayCandidate) {
    const assigned = assignPassengersToBerths(bestBayCandidate.berths, resolvedPreferences);
    const bestCoach = bestBayCandidate.coach || 'B1';
    const bestBay = bestBayCandidate.bayNumber || 1;
    return {
      allocatedBerths: assigned,
      cohesion: GROUP_COHESION_TIERS.SAME_BAY,
      groupScore: bestBayCandidate.score,
      coachList: [bestCoach],
      bayList: [bestBay],
      maxBaySpan: 0,
      isSameBay: true,
      isSameCoach: true,
      userRequestedConstraintMet: true,
      explanation: `All ${passengers} passengers seated in the same bay (${bestCoach} · Bay ${bestBay}).`,
      highlights: [
        `All ${passengers} in Same Bay (${bestCoach} · Bay ${bestBay})`,
        '100% Family Cohesion',
      ],
      reasons: [GROUP_REASON_CODES.GROUP_SAME_BAY_ALLOCATED],
    };
  }

  // ==========================================
  // TIER 2: ADJACENT BAYS CHECK (|bayA - bayB| === 1 in same coach)
  // ==========================================
  let bestAdjacentCandidate = null;
  let bestAdjacentScore = -1;

  for (const [coach, bayMap] of coachMap.entries()) {
    const sortedBays = Array.from(bayMap.keys()).sort((a, b) => a - b);

    for (let i = 0; i < sortedBays.length; i++) {
      const bayA = sortedBays[i];
      const bayB = sortedBays[i + 1];

      // Check if bays are physically adjacent in the train car
      if (bayB === bayA + 1) {
        const combinedBerths = [...bayMap.get(bayA), ...bayMap.get(bayB)];
        if (combinedBerths.length >= passengers) {
          let score = 0;
          const picked = combinedBerths.slice(0, passengers);
          for (const b of picked) {
            score += b.status === 'FULL_JOURNEY' ? 1000 : (b.coveragePercent || 0) * 6;
            if (b.class === travelClass) score += 200;
          }
          score += GROUP_BONUS_SCORES.ADJACENT_BAYS_PER_PAX * passengers;

          if (score > bestAdjacentScore) {
            bestAdjacentScore = score;
            bestAdjacentCandidate = {
              coach,
              bayList: [bayA, bayB],
              berths: picked,
              score,
            };
          }
        }
      }
    }
  }

  if (bestAdjacentCandidate) {
    const assigned = assignPassengersToBerths(bestAdjacentCandidate.berths, resolvedPreferences);
    const constraintMet = !sameBay; // Met if user didn't strictly require sameBay

    const feedback = sameBay
      ? `Same bay was unavailable, but all ${passengers} passengers are seated in adjacent bays of Coach ${bestAdjacentCandidate.coach} (Bays ${bestAdjacentCandidate.bayList.join(' & ')}).`
      : `All ${passengers} passengers seated in adjacent bays of Coach ${bestAdjacentCandidate.coach} (Bays ${bestAdjacentCandidate.bayList.join(' & ')}).`;

    return {
      allocatedBerths: assigned,
      cohesion: GROUP_COHESION_TIERS.ADJACENT_BAYS,
      groupScore: bestAdjacentCandidate.score,
      coachList: [bestAdjacentCandidate.coach],
      bayList: bestAdjacentCandidate.bayList,
      maxBaySpan: 1,
      isSameBay: false,
      isSameCoach: true,
      userRequestedConstraintMet: constraintMet,
      explanation: feedback,
      highlights: [
        `Adjacent Bays (${bestAdjacentCandidate.coach} · Bays ${bestAdjacentCandidate.bayList.join(' & ')})`,
        'Same Coach Guaranteed',
      ],
      reasons: [
        GROUP_REASON_CODES.GROUP_ADJACENT_BAYS_ALLOCATED,
        sameBay ? GROUP_REASON_CODES.GROUP_BAY_UNAVAILABLE : 'ADJACENT_SELECTION',
      ],
    };
  }

  // ==========================================
  // TIER 3: SAME COACH CHECK
  // ==========================================
  let bestCoachCandidate = null;
  let bestCoachScore = -1;

  for (const [coach, bayMap] of coachMap.entries()) {
    const coachBerths = [];
    for (const berthsInBay of bayMap.values()) {
      coachBerths.push(...berthsInBay);
    }

    if (coachBerths.length >= passengers) {
      // Sort coach berths by bayNumber to minimize spread
      coachBerths.sort((a, b) => a.bayNumber - b.bayNumber);
      const picked = coachBerths.slice(0, passengers);
      const baySpan = Math.abs(picked[picked.length - 1].bayNumber - picked[0].bayNumber);

      let score = 0;
      for (const b of picked) {
        score += b.status === 'FULL_JOURNEY' ? 1000 : (b.coveragePercent || 0) * 6;
        if (b.class === travelClass) score += 200;
      }
      score += GROUP_BONUS_SCORES.SAME_COACH_PER_PAX * passengers;
      // Penalize large bay spreads
      score -= baySpan * 15;

      if (score > bestCoachScore) {
        bestCoachScore = score;
        bestCoachCandidate = {
          coach,
          bayList: Array.from(new Set(picked.map((b) => b.bayNumber))),
          maxBaySpan: baySpan,
          berths: picked,
          score,
        };
      }
    }
  }

  if (bestCoachCandidate) {
    const assigned = assignPassengersToBerths(bestCoachCandidate.berths, resolvedPreferences);
    const constraintMet = !sameBay;

    const explanation = sameBay
      ? `Same coach available (${bestCoachCandidate.coach}), but same bay is not possible (seated across Bays ${bestCoachCandidate.bayList.join(', ')}).`
      : `All ${passengers} passengers seated in Coach ${bestCoachCandidate.coach} (Bays ${bestCoachCandidate.bayList.join(', ')}).`;

    return {
      allocatedBerths: assigned,
      cohesion: GROUP_COHESION_TIERS.SAME_COACH,
      groupScore: bestCoachCandidate.score,
      coachList: [bestCoachCandidate.coach],
      bayList: bestCoachCandidate.bayList,
      maxBaySpan: bestCoachCandidate.maxBaySpan,
      isSameBay: false,
      isSameCoach: true,
      userRequestedConstraintMet: constraintMet,
      explanation,
      highlights: [
        `All ${passengers} in Coach ${bestCoachCandidate.coach}`,
        `Bays ${bestCoachCandidate.bayList.join(', ')}`,
      ],
      reasons: [
        GROUP_REASON_CODES.GROUP_SAME_COACH_ALLOCATED,
        sameBay ? GROUP_REASON_CODES.GROUP_BAY_UNAVAILABLE : 'SAME_COACH_SELECTED',
      ],
    };
  }

  // ==========================================
  // TIER 4: SPLIT COACH FALLBACK
  // ==========================================
  // Group must be divided across different coaches
  availableBerths.sort((a, b) => {
    const scoreA = (a.status === 'FULL_JOURNEY' ? 1000 : 0) + (a.class === travelClass ? 200 : 0);
    const scoreB = (b.status === 'FULL_JOURNEY' ? 1000 : 0) + (b.class === travelClass ? 200 : 0);
    return scoreB - scoreA;
  });

  const picked = availableBerths.slice(0, passengers);
  const assigned = assignPassengersToBerths(picked, resolvedPreferences);
  const uniqueCoaches = Array.from(new Set(picked.map((b) => b.coach)));

  let totalScore = 0;
  for (const b of picked) {
    totalScore += b.status === 'FULL_JOURNEY' ? 1000 : (b.coveragePercent || 0) * 6;
    if (b.class === travelClass) totalScore += 200;
  }

  const explanation = sameCoach
    ? `Single coach unavailable for ${passengers} passengers. Group is split across coaches ${uniqueCoaches.join(' and ')}.`
    : `Berths allocated across coaches ${uniqueCoaches.join(' and ')}.`;

  return {
    allocatedBerths: assigned,
    cohesion: GROUP_COHESION_TIERS.SPLIT_COACH,
    groupScore: totalScore,
    coachList: uniqueCoaches,
    bayList: picked.map((b) => b.bayNumber),
    maxBaySpan: 99,
    isSameBay: false,
    isSameCoach: false,
    userRequestedConstraintMet: !sameCoach && !sameBay,
    explanation,
    highlights: [`Split across ${uniqueCoaches.length} coaches (${uniqueCoaches.join(', ')})`],
    reasons: [
      GROUP_REASON_CODES.GROUP_SPLIT_COACH,
      GROUP_REASON_CODES.GROUP_COACH_UNAVAILABLE,
    ],
  };
}
