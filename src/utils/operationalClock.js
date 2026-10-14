/**
 * operationalClock.js
 *
 * Provides timezone-invariant, authoritative Indian Railways operational clock rules.
 * Indian Railways operates strictly on Indian Standard Time (IST, UTC+5:30).
 */

/**
 * Returns current date and time converted to Indian Standard Time (UTC+5:30)
 * regardless of the user device's local timezone.
 *
 * @returns {Date}
 */
export function getIstNow() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffsetMs);
}

/**
 * Returns IST today's date ("YYYY-MM-DD") and current minute of the day (0-1439).
 *
 * @returns {{ istNow: Date, todayStr: string, nowMinutes: number }}
 */
export function getIstDateAndMinutes() {
  const istNow = getIstNow();
  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, '0');
  const day = String(istNow.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const nowMinutes = istNow.getHours() * 60 + istNow.getMinutes();
  return { istNow, todayStr, nowMinutes };
}

/**
 * Evaluates authoritative Indian Railways operational charting status for a train.
 *
 * Rules:
 * 1. Departed: Current IST time on journey date is at or past scheduled departure time (or journey date is in the past).
 * 2. Final Chart: Finalized ~30 minutes prior to departure. Online booking is CLOSED. Vacant berths handed to on-train TTE.
 * 3. First Chart: Prepared ~4 hours prior to departure (or 23:30 previous night for early morning departures <= 06:00).
 *    Current Reservation is OPEN on IRCTC portal until Final Chart.
 * 4. Advance Booking: Train departure is > 4 hours in the future.
 *
 * @param {string} journeyDate - "YYYY-MM-DD"
 * @param {string} depTime - "HH:MM"
 * @param {Object} [serverTrain={}] - Train object returned from server
 * @returns {Object} {
 *   isDeparted: boolean,
 *   isPastFirstChart: boolean,
 *   isPastFinalChart: boolean,
 *   isTTEOnly: boolean,
 *   bookingChannel: string,
 *   bookingChannelLabel: string,
 *   firstChartTimeFormatted: string,
 *   finalChartTimeFormatted: string
 * }
 */
export function getTrainOperationalStatus(journeyDate, depTime, serverTrain = {}) {
  const { todayStr, nowMinutes } = getIstDateAndMinutes();
  const jDate = journeyDate || serverTrain.journeyDate || todayStr;
  const dTime = depTime || serverTrain.departureTime || '--:--';

  let isDeparted = Boolean(
    serverTrain.isDeparted ||
    serverTrain.chartStatus === 'DEPARTED' ||
    (serverTrain.chartLabel && serverTrain.chartLabel.toLowerCase().includes('departed'))
  );

  let isPastFirstChart = Boolean(
    serverTrain.chartTimings?.isFirstChartDone ||
    serverTrain.isChartPrepared ||
    serverTrain.chartStatus === 'CHART_PREPARED' ||
    serverTrain.chartStatus === 'FINAL_CHART' ||
    serverTrain.chartOneDate
  );

  let isPastFinalChart = Boolean(
    serverTrain.chartTimings?.isSecondChartDone ||
    serverTrain.chartStatus === 'FINAL_CHART' ||
    serverTrain.chartTwoDate
  );

  let firstChartTimeFormatted = '';
  let finalChartTimeFormatted = '';

  if (dTime && dTime.includes(':') && dTime !== '--:--') {
    const [h, m] = dTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const depTotalMin = h * 60 + m;

      // Final chart: ~30 mins before departure
      let finalChartMin = depTotalMin - 30;
      if (finalChartMin < 0) finalChartMin += 24 * 60;
      finalChartTimeFormatted = `${String(Math.floor(finalChartMin / 60)).padStart(2, '0')}:${String(finalChartMin % 60).padStart(2, '0')}`;

      // First chart: ~4 hours before departure (or 23:30 prev night for <= 06:00 departures)
      const isEarlyMorning = depTotalMin <= 6 * 60;
      if (isEarlyMorning) {
        firstChartTimeFormatted = '23:30 (Prev Night)';
      } else {
        let firstChartMin = depTotalMin - 4 * 60;
        if (firstChartMin < 0) firstChartMin += 24 * 60;
        firstChartTimeFormatted = `${String(Math.floor(firstChartMin / 60)).padStart(2, '0')}:${String(firstChartMin % 60).padStart(2, '0')}`;
      }

      if (jDate < todayStr) {
        isDeparted = true;
        isPastFirstChart = true;
        isPastFinalChart = true;
      } else if (jDate === todayStr) {
        if (nowMinutes >= depTotalMin) {
          isDeparted = true;
          isPastFirstChart = true;
          isPastFinalChart = true;
        } else {
          // If within 30 minutes of departure, final chart is finalized
          if (depTotalMin < 30 || nowMinutes >= (depTotalMin - 30)) {
            isPastFinalChart = true;
            isPastFirstChart = true;
          } else if (isEarlyMorning || nowMinutes >= (depTotalMin - 240)) {
            // Within 4 hours of departure: 1st chart is prepared
            isPastFirstChart = true;
          }
        }
      }
    }
  }

  // Once departed, it's not TTE only, it's DEPARTED
  const isTTEOnly = !isDeparted && (
    serverTrain.bookingChannel === 'TTE_ONLY' ||
    isPastFinalChart
  );

  let bookingChannel = serverTrain.bookingChannel || 'IRCTC_ADVANCE_BOOKING';
  let bookingChannelLabel = serverTrain.bookingChannelLabel || 'IRCTC Advance Booking';

  if (isDeparted) {
    bookingChannel = 'DEPARTED';
    bookingChannelLabel = 'Train Departed • Booking Closed';
  } else if (isTTEOnly) {
    bookingChannel = 'TTE_ONLY';
    bookingChannelLabel = 'TTE On-Board Allocation Only';
  } else if (isPastFirstChart) {
    bookingChannel = 'IRCTC_CURRENT_BOOKING';
    bookingChannelLabel = 'Current Booking Open on IRCTC';
  }

  return {
    isDeparted,
    isPastFirstChart,
    isPastFinalChart,
    isTTEOnly,
    bookingChannel,
    bookingChannelLabel,
    firstChartTimeFormatted,
    finalChartTimeFormatted,
  };
}
