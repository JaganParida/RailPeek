/**
 * Centralized Cache Policy and Intelligent TTL Configuration.
 * Volatility hierarchy ensures expensive, volatile availability queries have
 * short TTLs while static route/coach data has long TTLs.
 */

export const CACHE_POLICY = {
  // Static Station Metadata
  station: {
    ttlSeconds: 86400 * 7, // 7 days
    staleSeconds: 86400 * 1, // 1 day
    allowStaleOnFailure: true,
  },

  // Train Static Metadata
  trainMetadata: {
    ttlSeconds: 86400 * 3, // 3 days
    staleSeconds: 86400, // 24 hours
    allowStaleOnFailure: true,
  },

  // Route & Schedule Information
  route: {
    ttlSeconds: 86400, // 24 hours
    staleSeconds: 43200, // 12 hours
    allowStaleOnFailure: true,
  },

  // Physical Coach Layout (e.g. 3A 72-berth layout)
  coachLayout: {
    ttlSeconds: 86400 * 14, // 14 days
    staleSeconds: 86400 * 7, // 7 days
    allowStaleOnFailure: true,
  },

  // Active Train Availability (Volatile)
  availability: {
    ttlSeconds: 120, // 2 minutes hard expiration
    staleSeconds: 45, // 45 seconds stale-while-revalidate threshold
    allowStaleOnFailure: false, // Never serve dangerously stale availability on provider failure
  },

  // Charting / Vacancy explorer
  chartVacancy: {
    ttlSeconds: 60, // 60 seconds
    staleSeconds: 20, // 20 seconds
    allowStaleOnFailure: false,
  },

  // AI Generated Explanation (Immutable for identical berth results)
  aiExplanation: {
    ttlSeconds: 86400 * 2, // 48 hours
    staleSeconds: 86400, // 24 hours
    allowStaleOnFailure: true,
  },
};
