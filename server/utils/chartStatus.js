/**
 * Indian Railways Chart Preparation Status Calculator
 *
 * Rules (Official Indian Railways / IRCTC):
 * - First Chart: Finalized ~4 hours before scheduled departure of the train.
 * - Second Chart: Finalized 30 minutes before scheduled departure.
 * - Prior to chart preparation: Status is CHART_NOT_PREPARED.
 *
 * @param {string} journeyDate - "YYYY-MM-DD"
 * @param {string} [departureTime="--:--"] - "HH:MM"
 * @returns {{
 *   chartStatus: "CHART_PREPARED" | "CHART_NOT_PREPARED",
 *   chartLabel: string,
 *   chartDescription: string,
 *   isPrepared: boolean
 * }}
 */
export function evaluateChartStatus(journeyDate, departureTime = '--:--') {
  if (!journeyDate) {
    return {
      chartStatus: 'CHART_NOT_PREPARED',
      chartLabel: 'Chart Not Prepared',
      chartDescription: 'First chart is prepared 4 hours prior to scheduled departure.',
      isPrepared: false,
    };
  }

  // Authoritative Indian Standard Time (UTC+5:30) calculation
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffsetMs);

  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, '0');
  const day = String(istNow.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const nowMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  const journeyDateClean = String(journeyDate).trim().slice(0, 10);

  // Future dates (tomorrow and beyond)
  if (journeyDateClean > todayStr) {
    // Check if early morning departure tomorrow (<= 06:00 AM) and current IST time >= 23:30 today
    // (Indian Railways prepares 00:01-06:00 charts at 23:30 previous night)
    const tomorrow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000);
    const tomYear = tomorrow.getFullYear();
    const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomDay = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

    if (journeyDateClean === tomorrowStr && departureTime && departureTime.includes(':')) {
      const [h, m] = departureTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const depMin = h * 60 + m;
        if (depMin <= 6 * 60 && nowMinutes >= 23 * 60 + 30) {
          return {
            chartStatus: 'CHART_PREPARED',
            chartLabel: 'First Chart Prepared',
            chartDescription: 'Official Indian Railways First Chart finalized at 23:30 previous night.',
            isPrepared: true,
          };
        }
      }
    }

    return {
      chartStatus: 'CHART_NOT_PREPARED',
      chartLabel: 'Chart Not Prepared',
      chartDescription: `Scheduled for ${journeyDateClean}. First chart will be finalized 4 hours prior to departure.`,
      isPrepared: false,
    };
  }

  // Past dates
  if (journeyDateClean < todayStr) {
    return {
      chartStatus: 'CHART_PREPARED',
      chartLabel: 'Chart Finalized',
      chartDescription: 'Historical journey chart finalized by Indian Railways.',
      isPrepared: true,
    };
  }

  // TODAY: Evaluate departure time against current IST time
  if (departureTime && departureTime !== '--:--' && departureTime.includes(':')) {
    const [depH, depM] = departureTime.split(':').map(Number);
    if (!isNaN(depH) && !isNaN(depM)) {
      const depMinutes = depH * 60 + depM;

      // Early morning departures (00:01-06:00) were already prepared at 23:30 previous night
      if (depMinutes <= 6 * 60) {
        return {
          chartStatus: 'CHART_PREPARED',
          chartLabel: 'First Chart Prepared',
          chartDescription: 'Official Indian Railways First Chart finalized at 23:30 previous night.',
          isPrepared: true,
        };
      }

      const diffMinutes = depMinutes - nowMinutes;

      // Within 4 hours (240 minutes) of departure or already departed today
      if (diffMinutes <= 240) {
        return {
          chartStatus: 'CHART_PREPARED',
          chartLabel: 'First Chart Prepared',
          chartDescription: 'Official Indian Railways First Chart finalized. Real-time vacant berths displayed.',
          isPrepared: true,
        };
      }
    }
  }

  // Departing today but more than 4 hours in advance
  return {
    chartStatus: 'CHART_NOT_PREPARED',
    chartLabel: 'Chart Not Prepared',
    chartDescription: 'Departing today. First chart will be finalized ~4 hours before scheduled departure.',
    isPrepared: false,
  };
}
