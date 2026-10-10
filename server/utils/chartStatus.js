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

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const journeyDateClean = String(journeyDate).trim().slice(0, 10);

  // Future dates (tomorrow and beyond)
  if (journeyDateClean > todayStr) {
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

  // TODAY: Evaluate departure time against current time
  if (departureTime && departureTime !== '--:--' && departureTime.includes(':')) {
    const [depH, depM] = departureTime.split(':').map(Number);
    if (!isNaN(depH) && !isNaN(depM)) {
      const depDate = new Date();
      depDate.setHours(depH, depM, 0, 0);

      const diffHours = (depDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Within 4 hours of departure or already departed today
      if (diffHours <= 4) {
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
