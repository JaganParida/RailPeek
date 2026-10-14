/**
 * Centralized Cache Policy and Intelligent Lifecycle-Aware TTL Configuration.
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
    ttlSeconds: 120, // 2 minutes default
    staleSeconds: 45, // 45 seconds
    allowStaleOnFailure: false,
  },

  // AI Generated Explanation (Immutable for identical berth results)
  aiExplanation: {
    ttlSeconds: 86400 * 2, // 48 hours
    staleSeconds: 86400, // 24 hours
    allowStaleOnFailure: true,
  },
};

/**
 * Calculates Indian Standard Time (IST, UTC+5:30) difference in minutes
 * between now and a scheduled train departure time.
 *
 * @param {string} [journeyDate] - "YYYY-MM-DD"
 * @param {string} [departureTime] - "HH:mm"
 * @returns {number|null} Difference in minutes (positive = future, negative = departed)
 */
export function getMinutesUntilDeparture(journeyDate, departureTime) {
  if (!journeyDate || !departureTime || !departureTime.includes(':')) {
    return null;
  }

  try {
    const [year, month, day] = journeyDate.split('-').map(Number);
    const [hour, min] = departureTime.split(':').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(min)) {
      return null;
    }

    // Departure timestamp in UTC (IST is UTC+5:30)
    const depUtcMs = Date.UTC(year, month - 1, day, hour - 5, min - 30);
    const nowUtcMs = Date.now();
    return Math.floor((depUtcMs - nowUtcMs) / 60000);
  } catch {
    return null;
  }
}

/**
 * Authoritative Indian Railways Lifecycle-Aware Cache Policy.
 * Dynamically computes Redis/Memory TTL according to official Indian Railways charting rules:
 *
 * 1. DEPARTED: Train has left. Online booking closed. Frozen immutable chart.
 *    -> TTL: 8 Hours (28,800s). All 1,000+ searches served from Redis in 1ms.
 *
 * 2. FINAL_CHART: 2nd/Final chart prepared (~30m before dep). Booking closed on IRCTC portal.
 *    -> TTL: 6 Hours (21,600s). Vacancy data immutable. 0 hits to IRCTC.
 *
 * 3. 1ST CHART PREPARED: Between Chart 1 (~4h before dep) and Chart 2 (~30m before dep).
 *    -> Composition (Coaches list): Fixed after Chart 1. TTL = 30 Minutes (1,800s).
 *    -> Vacant Berths: Active current booking window. TTL = 2 Minutes (120s).
 *
 * 4. BEFORE 1ST CHART (> 4h before dep):
 *    -> Chart cannot prepare for hours. Dynamic TTL caches { isPrepared: false }
 *       for 15-30 minutes until chart preparation window opens.
 *
 * @param {Object} params
 * @param {string} [params.journeyDate] - "YYYY-MM-DD"
 * @param {string} [params.departureTime] - "HH:mm" (IST)
 * @param {boolean} [params.isPrepared=false] - Whether Chart 1 is prepared
 * @param {boolean} [params.isDeparted=false] - Whether train has departed
 * @param {string} [params.chartOneDate] - Timestamp from IRCTC if chart 1 prepared
 * @param {string} [params.chartTwoDate] - Timestamp from IRCTC if chart 2 prepared
 * @param {'composition' | 'vacantBerths' | 'coach' | 'status'} [params.dataType='composition']
 * @returns {{ ttlSeconds: number, staleSeconds: number, stage: string, description: string }}
 */
export function getLifecycleCachePolicy({
  journeyDate,
  departureTime,
  isPrepared = false,
  isDeparted = false,
  chartOneDate = null,
  chartTwoDate = null,
  dataType = 'composition',
} = {}) {
  const diffMinutes = getMinutesUntilDeparture(journeyDate, departureTime);

  // Stage 1: Train Departed
  if (isDeparted || (diffMinutes !== null && diffMinutes <= 0)) {
    return {
      ttlSeconds: 8 * 3600, // 8 hours
      staleSeconds: 4 * 3600,
      stage: 'DEPARTED',
      description: 'Train has departed. Operational chart is permanently frozen and immutable.',
    };
  }

  // Stage 2: Second / Final Chart Prepared (< 30 mins before dep or chartTwoDate present)
  const isFinalChart = Boolean(chartTwoDate || (diffMinutes !== null && diffMinutes <= 30));
  if (isFinalChart) {
    return {
      ttlSeconds: 6 * 3600, // 6 hours
      staleSeconds: 2 * 3600,
      stage: 'FINAL_CHART',
      description: 'Second/Final chart is prepared. IRCTC online booking closed. Berths immutable.',
    };
  }

  // Stage 3: First Chart Prepared (Between Chart 1 and Chart 2)
  const isFirstChartDone = Boolean(chartOneDate || isPrepared);
  if (isFirstChartDone) {
    if (dataType === 'composition') {
      // Coach composition (rake order) is fixed once Chart 1 is prepared
      const minutesToFinal = diffMinutes !== null ? diffMinutes - 30 : 180;
      const ttlSec = Math.max(300, Math.min(minutesToFinal * 60, 1800)); // 5 to 30 mins
      return {
        ttlSeconds: ttlSec,
        staleSeconds: Math.floor(ttlSec / 2),
        stage: 'CHART_PREPARED',
        description: 'First chart prepared. Train composition is fixed until final chart.',
      };
    }

    // Vacant berths & coach layout: Active current booking window
    return {
      ttlSeconds: 120, // 2 minutes active window
      staleSeconds: 60,
      stage: 'CHART_PREPARED',
      description: 'First chart prepared. Current booking active. Cached for high concurrency.',
    };
  }

  // Stage 4: Advance Window / Chart Not Prepared (> 4 hours before dep)
  // First chart is prepared ~4 hours (240 mins) before departure
  const minutesUntilFirstChart = diffMinutes !== null ? diffMinutes - 240 : 180;

  if (minutesUntilFirstChart > 15) {
    // First chart cannot be prepared for at least another `minutesUntilFirstChart` minutes
    const ttlSec = Math.max(300, Math.min(minutesUntilFirstChart * 60, 1800)); // 5m to 30m
    return {
      ttlSeconds: ttlSec,
      staleSeconds: Math.floor(ttlSec / 2),
      stage: 'CHART_NOT_PREPARED',
      description: `First chart is not prepared. Charting window opens in ~${minutesUntilFirstChart}m.`,
    };
  }

  // Imminent charting window (within 15 minutes of chart preparation)
  return {
    ttlSeconds: 90, // 90 seconds
    staleSeconds: 45,
    stage: 'CHART_PREPARING_SOON',
    description: 'First chart preparation window is active.',
  };
}
