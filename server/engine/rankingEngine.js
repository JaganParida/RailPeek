/**
 * RailPeek Deterministic Ranking & Best Match Engine
 *
 * Ranks candidate train journeys and allocates optimal berth combinations
 * based on deterministic criteria:
 * 1. Journey coverage (Full Journey > High Partial > Low Partial)
 * 2. Exact requested travel class match
 * 3. Berth type preference match (Lower, Upper, Side Lower, etc.)
 * 4. Group proximity (Same Bay > Same Coach > Nearby)
 * 5. Origin boarding availability
 *
 * Absolute rule: NEVER uses AI or random weights for ranking.
 */

import { matchGroupBerths } from './groupMatchingEngine.js';

/**
 * Score constant weights
 */
export const RANKING_WEIGHTS = {
  FULL_JOURNEY_BASE: 1000,
  UNAVAILABLE_BASE: 0,
  CLASS_EXACT_MATCH: 200,
  CLASS_UPGRADE_MATCH: 100,
  BERTH_PREFERENCE_MATCH: 150,
  ANY_PREFERENCE_NEUTRAL: 50,
  BOARDING_AT_ORIGIN: 60,
  DEBOARDING_AT_DESTINATION: 40,
  GROUP_SAME_BAY: 180,
  GROUP_SAME_COACH: 100,
  GROUP_ADJACENT_BAY: 50,
};

/**
 * Scores an individual berth based on passenger criteria.
 *
 * @param {Object} berth
 * @param {Object} criteria
 * @param {string} criteria.travelClass
 * @param {string} [criteria.berthPreference="ANY"]
 * @returns {{ score: number, highlights: string[], reasons: string[] }}
 */
export function scoreBerth(berth, criteria = {}) {
  const { travelClass = '3A', berthPreference = 'ANY' } = criteria;
  let score = 0;
  const highlights = [];
  const reasons = [];

  // 1. Coverage Score
  if (berth.status === 'FULL_JOURNEY') {
    score += RANKING_WEIGHTS.FULL_JOURNEY_BASE;
    highlights.push('Full Journey Coverage (100%)');
    reasons.push('FULL_JOURNEY_AVAILABLE');
  } else if (berth.status === 'PARTIAL_JOURNEY') {
    const coverageWeight = Math.round((berth.coveragePercent || 0) * 6);
    score += coverageWeight;
    highlights.push(`${berth.coveragePercent}% Journey Coverage`);
    reasons.push('PARTIAL_COVERAGE');
  } else {
    reasons.push('OCCUPIED_DURING_JOURNEY');
    return { score: 0, highlights: ['Unavailable'], reasons };
  }

  // 2. Class Match
  if (berth.class === travelClass) {
    score += RANKING_WEIGHTS.CLASS_EXACT_MATCH;
    highlights.push(`Class ${berth.class} Match`);
    reasons.push('EXACT_CLASS_MATCH');
  } else {
    // If requested 3A but 2A or 1A is offered (upgrade)
    if (
      (travelClass === '3A' && (berth.class === '2A' || berth.class === '1A')) ||
      (travelClass === '2A' && berth.class === '1A')
    ) {
      score += RANKING_WEIGHTS.CLASS_UPGRADE_MATCH;
      highlights.push(`Premium Class Upgrade (${berth.class})`);
      reasons.push('UPGRADE_CLASS');
    } else {
      reasons.push('CLASS_MISMATCH');
    }
  }

  // 3. Berth Preference Match
  const pref = (berthPreference || 'ANY').toUpperCase();
  if (pref !== 'ANY') {
    if (berth.berthType === pref || (pref === 'WINDOW' && berth.berthType === 'SIDE_LOWER')) {
      score += RANKING_WEIGHTS.BERTH_PREFERENCE_MATCH;
      highlights.push(`Preferred Berth: ${berth.berthType}`);
      reasons.push('PREFERENCE_MATCH');
    } else {
      reasons.push('PREFERENCE_UNMATCHED');
    }
  } else {
    score += RANKING_WEIGHTS.ANY_PREFERENCE_NEUTRAL;
  }

  // 4. Boarding / Deboarding convenience
  if (berth.isBoardingAvailable) {
    score += RANKING_WEIGHTS.BOARDING_AT_ORIGIN;
  }
  if (berth.isDeboardingAvailable) {
    score += RANKING_WEIGHTS.DEBOARDING_AT_DESTINATION;
  }

  return { score, highlights, reasons };
}

/**
 * Finds the optimal combination of berths in a coach for a group of N passengers (1 to 6).
 *
 * Priority:
 * 1. Same bay allocation (highest cohesion)
 * 2. Same coach allocation
 * 3. Preference match priority
 *
 * @param {Object[]} candidateBerths - Array of evaluated berths
 * @param {Object} criteria
 * @param {number} [criteria.passengers=1]
 * @param {string} [criteria.travelClass="3A"]
 * @param {string} [criteria.berthPreference="ANY"]
 * @param {boolean} [criteria.sameBay=false]
 * @param {boolean} [criteria.sameCoach=true]
 * @returns {{
 *   allocatedBerths: Object[],
 *   groupScore: number,
 *   cohesion: "SAME_BAY" | "SAME_COACH" | "SPLIT_COACH" | "INSUFFICIENT_BERTHS",
 *   highlights: string[],
 *   reasons: string[]
 * }}
 */
export function allocateGroupBerths(candidateBerths, criteria = {}) {
  return matchGroupBerths(candidateBerths, criteria);
}

/**
 * Sorts berths by passenger desirability priority:
 * 1. Full Journey (100%) > Partial Journey
 * 2. Side Lower > Lower > Side Upper > Upper > Middle
 * 3. Coverage percentage (descending)
 * 4. Coach name
 * 5. Berth number (ascending)
 *
 * @param {Object[]} berths
 * @returns {Object[]}
 */
export function sortBerthsByDesirability(berths) {
  if (!Array.isArray(berths)) return [];

  const TYPE_RANK = {
    SIDE_LOWER: 1,
    SL: 1,
    LOWER: 2,
    LB: 2,
    L: 2,
    SIDE_UPPER: 3,
    SU: 3,
    UPPER: 4,
    UB: 4,
    U: 4,
    MIDDLE: 5,
    MB: 5,
    M: 5,
    CABIN: 6,
    COUPE: 7,
    WINDOW: 1,
    WS: 1,
    AISLE: 2,
    AS: 2,
    MS: 5,
  };

  return [...berths].sort((a, b) => {
    // 1. Full journey coverage first
    const aFull = a.status === 'FULL_JOURNEY' || a.coveragePercent === 100 ? 1 : 0;
    const bFull = b.status === 'FULL_JOURNEY' || b.coveragePercent === 100 ? 1 : 0;
    if (aFull !== bFull) return bFull - aFull;

    // 2. Berth type priority: Side Lower > Lower > Side Upper > Upper > Middle
    const aType = (a.berthType || a.berthCode || '').toUpperCase();
    const bType = (b.berthType || b.berthCode || '').toUpperCase();
    const aRank = TYPE_RANK[aType] ?? 99;
    const bRank = TYPE_RANK[bType] ?? 99;
    if (aRank !== bRank) return aRank - bRank;

    // 3. Higher coverage percent if partial
    const aCov = Number(a.coveragePercent) || 0;
    const bCov = Number(b.coveragePercent) || 0;
    if (aCov !== bCov) return bCov - aCov;

    // 4. Coach order
    const coachCompare = (a.coach || '').localeCompare(b.coach || '');
    if (coachCompare !== 0) return coachCompare;

    // 5. Berth number
    return (Number(a.berthNumber) || 0) - (Number(b.berthNumber) || 0);
  });
}

/**
 * Deterministically ranks and buckets candidate train journeys into:
 * - bestMatch
 * - alternatives
 * - partialOptions
 *
 * @param {Object[]} candidateTrainResults - Array of train evaluation objects
 * @param {Object} criteria - Search and preference criteria
 * @returns {{
 *   bestMatch: Object|null,
 *   alternatives: Object[],
 *   partialOptions: Object[],
 *   totalEvaluated: number
 * }}
 */
export function rankTrainJourneyOptions(candidateTrainResults, criteria = {}) {
  if (!Array.isArray(candidateTrainResults) || candidateTrainResults.length === 0) {
    return {
      bestMatch: null,
      alternatives: [],
      partialOptions: [],
      totalEvaluated: 0,
    };
  }

  const passengers = Math.max(1, Math.min(6, criteria.passengers || 1));
  const travelClass = criteria.class || '3A';
  const berthPreference = criteria.berthPreference || 'ANY';

  const scoredOptions = [];

  for (const trainResult of candidateTrainResults) {
    if (travelClass !== 'ALL' && trainResult.travelClass && trainResult.travelClass !== travelClass) {
      continue;
    }
    const berths = trainResult.berths || [];
    if (berths.length === 0) continue;

    // Run group allocation on the train's berths
    const allocation = allocateGroupBerths(berths, {
      passengers,
      travelClass,
      berthPreference,
      passengerPreferences: criteria.passengerPreferences,
      sameBay: criteria.sameBay,
      sameCoach: criteria.sameCoach,
    });

    if (allocation.allocatedBerths.length < passengers) {
      continue;
    }

    // Determine overall coverage of the allocated group
    const avgCoverage = Math.round(
      allocation.allocatedBerths.reduce((sum, b) => sum + (b.coveragePercent || 0), 0) / passengers
    );

    const isFullJourney = allocation.allocatedBerths.every((b) => b.status === 'FULL_JOURNEY');
    const isPartialJourney = !isFullJourney && avgCoverage > 0;

    let category = 'GOOD_ALTERNATIVE';
    if (isPartialJourney) {
      category = 'PARTIAL_OPTION';
    }

    // Extract journey availability bounds
    const primaryBerth = allocation.allocatedBerths[0];

    scoredOptions.push({
      category,
      score: allocation.groupScore,
      cohesion: allocation.cohesion,
      maxBaySpan: allocation.maxBaySpan,
      coachList: allocation.coachList,
      bayList: allocation.bayList,
      isSameBay: allocation.isSameBay,
      isSameCoach: allocation.isSameCoach,
      groupExplanation: allocation.explanation,
      userRequestedConstraintMet: allocation.userRequestedConstraintMet,
      trainNumber: trainResult.trainNumber,
      trainName: trainResult.trainName || `Train ${trainResult.trainNumber}`,
      fromStation: trainResult.fromStation || trainResult.from,
      fromStationName: trainResult.fromStationName || trainResult.from,
      toStation: trainResult.toStation || trainResult.to,
      toStationName: trainResult.toStationName || trainResult.to,
      origin: trainResult.origin,
      originName: trainResult.originName,
      destination: trainResult.destination,
      destName: trainResult.destName,
      departureTime: trainResult.departureTime || '--:--',
      arrivalTime: trainResult.arrivalTime || '--:--',
      distanceKm: trainResult.distanceKm || 0,
      coach: primaryBerth.coach || 'B1',
      travelClass: primaryBerth.class || primaryBerth.travelClass || '3A',
      coverageStatus: isFullJourney ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY',
      coveragePercent: avgCoverage,
      availableFrom: primaryBerth.availableFrom,
      availableTo: primaryBerth.availableTo,
      allocatedBerths: allocation.allocatedBerths,
      availableBerths: sortBerthsByDesirability(berths),
      totalVacantCount: berths.length,
      matchHighlights: allocation.highlights,
      reasonCodes: allocation.reasons,
      source: trainResult.source || 'demo',
      isDemo: trainResult.isDemo ?? true,
      isChartPrepared: trainResult.isChartPrepared ?? false,
      isDeparted: trainResult.isDeparted ?? false,
      chartStatus: trainResult.chartStatus || 'CHART_NOT_PREPARED',
      chartLabel: trainResult.chartLabel || '',
      chartDescription: trainResult.chartDescription || '',
      chartOneDate: trainResult.chartOneDate || null,
      chartTwoDate: trainResult.chartTwoDate || null,
      chartTimings: trainResult.chartTimings || null,
      bookingChannel: trainResult.bookingChannel || 'IRCTC_ADVANCE_BOOKING',
      bookingChannelLabel: trainResult.bookingChannelLabel || 'Book on IRCTC',
      bookingChannelDesc: trainResult.bookingChannelDesc || '',
      canBookOnline: trainResult.canBookOnline ?? true,
      avlRemoteForBooking: trainResult.avlRemoteForBooking || null,
      fetchedAt: trainResult.fetchedAt || new Date().toISOString(),
    });
  }

  // Sort all options descending by score
  scoredOptions.sort((a, b) => b.score - a.score);

  // Segregate into bestMatch, alternatives, partialOptions
  let bestMatch = null;
  const alternatives = [];
  const partialOptions = [];

  for (const opt of scoredOptions) {
    if (!bestMatch) {
      opt.category = 'BEST_MATCH';
      bestMatch = opt;
    } else if (opt.coverageStatus === 'FULL_JOURNEY') {
      opt.category = 'GOOD_ALTERNATIVE';
      alternatives.push(opt);
    } else {
      opt.category = 'PARTIAL_OPTION';
      partialOptions.push(opt);
    }
  }

  return {
    bestMatch,
    alternatives,
    partialOptions,
    totalEvaluated: scoredOptions.length,
  };
}
