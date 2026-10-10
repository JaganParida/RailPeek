/**
 * Deterministic Cache Key Generator for RailPeek.
 * Enforces canonical formatting so equivalent requests always generate identical keys.
 */

/**
 * Normalize station code: trimmed, uppercase
 * @param {string} code
 * @returns {string}
 */
export function normalizeStationCode(code) {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Normalize date: trimmed YYYY-MM-DD
 * @param {string} date
 * @returns {string}
 */
export function normalizeDate(date) {
  if (!date) return '';
  return date.trim().slice(0, 10);
}

/**
 * Generate canonical cache key for Train Availability
 *
 * @param {Object} params
 * @param {string} [params.provider="mock"] - "live" | "mock"
 * @param {string} params.trainNumber - e.g. "18477"
 * @param {string} params.date - e.g. "2026-10-12"
 * @param {string} params.from - e.g. "BBS"
 * @param {string} params.to - e.g. "NDLS"
 * @param {string} [params.travelClass="3A"] - e.g. "3A"
 * @param {string} [params.quota="GN"] - e.g. "GN"
 * @returns {string} Canonical key
 */
export function getAvailabilityCacheKey({
  provider = 'mock',
  trainNumber,
  date,
  from,
  to,
  travelClass = '3A',
  coach,
  quota = 'GN',
}) {
  const normProvider = (provider || 'mock').toLowerCase().trim();
  const normTrain = String(trainNumber || '').trim();
  const normDate = normalizeDate(date);
  const normFrom = normalizeStationCode(from);
  const normTo = normalizeStationCode(to);
  const normClass = (travelClass || '3A').toUpperCase().trim();
  const coachPart = coach ? `:coach=${coach.toUpperCase().trim()}` : '';
  const normQuota = (quota || 'GN').toUpperCase().trim();

  return `availability:v1:provider=${normProvider}:train=${normTrain}:date=${normDate}:from=${normFrom}:to=${normTo}:class=${normClass}${coachPart}:quota=${normQuota}`;
}

/**
 * Generate canonical cache key for Train Route
 * @param {string} trainNumber
 * @returns {string}
 */
export function getRouteCacheKey(trainNumber) {
  return `route:v1:train=${String(trainNumber).trim()}`;
}

/**
 * Generate canonical cache key for Station Search
 * @param {string} query
 * @param {number} limit
 * @returns {string}
 */
export function getStationSearchCacheKey(query, limit = 10) {
  return `station:search:v1:q=${encodeURIComponent(query.trim().toLowerCase())}:limit=${limit}`;
}

/**
 * Generate canonical cache key for Coach Layout
 * @param {string} trainNumber
 * @param {string} coachId
 * @returns {string}
 */
export function getCoachLayoutCacheKey(trainNumber, coachId) {
  return `coach:v1:train=${String(trainNumber).trim()}:coach=${String(coachId).toUpperCase().trim()}`;
}

/**
 * Generate canonical cache key for Coach Vacancy
 * @param {Object} params
 * @param {string} params.trainNumber
 * @param {string} params.coachId
 * @param {string} [params.date]
 * @param {string} [params.from]
 * @param {string} [params.to]
 * @returns {string}
 */
export function getCoachVacancyCacheKey({ trainNumber, coachId, date, from, to }) {
  const normTrain = String(trainNumber || '').trim();
  const normCoach = String(coachId || '').toUpperCase().trim();
  const normDate = normalizeDate(date);
  const normFrom = normalizeStationCode(from);
  const normTo = normalizeStationCode(to);
  return `coach:vacancy:v1:train=${normTrain}:coach=${normCoach}:date=${normDate}:from=${normFrom}:to=${normTo}`;
}

/**
 * Generate canonical cache key for AI Journey / Berth Explanation
 * @param {Object} params
 * @param {string} params.trainNumber
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} [params.date]
 * @param {string} [params.travelClass]
 * @param {Array<Object>} [params.allocatedBerths]
 * @returns {string}
 */
export function getExplainCacheKey({ trainNumber, from, to, date, travelClass, allocatedBerths = [] }) {
  const normTrain = String(trainNumber || '').trim();
  const normFrom = normalizeStationCode(from);
  const normTo = normalizeStationCode(to);
  const normDate = normalizeDate(date);
  const normClass = String(travelClass || '').toUpperCase().trim();
  const berthsSig = (allocatedBerths || [])
    .map((b) => `${b.coach || ''}:${b.berthNumber || ''}`)
    .sort()
    .join(',');
  return `explain:v1:train=${normTrain}:from=${normFrom}:to=${normTo}:date=${normDate}:class=${normClass}:berths=${berthsSig}`;
}
