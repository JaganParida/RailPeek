/**
 * Base abstract class defining the Railway Provider interface.
 * All concrete providers (Mock, Live, etc.) must implement this contract.
 */
export class RailwayProvider {
  constructor(name = 'BaseRailwayProvider') {
    this.name = name;
  }

  /**
   * Search stations by code, city, or name
   * @param {string} _query
   * @param {number} [_limit=10]
   * @returns {Promise<Array<Object>>}
   */
  async searchStations(_query, _limit = 10) {
    throw new Error('Method searchStations() not implemented.');
  }

  /**
   * Get single station details by code
   * @param {string} _code
   * @returns {Promise<Object|null>}
   */
  async getStation(_code) {
    throw new Error('Method getStation() not implemented.');
  }

  /**
   * Search trains running between origin and destination on a given date
   * @param {string} _from
   * @param {string} _to
   * @param {string} _date - YYYY-MM-DD
   * @returns {Promise<Array<Object>>}
   */
  async searchTrains(_from, _to, _date) {
    throw new Error('Method searchTrains() not implemented.');
  }

  /**
   * Get full train schedule and ordered route stops
   * @param {string} _trainNumber
   * @returns {Promise<{ train: Object, route: Array<Object> }|null>}
   */
  async getTrainRoute(_trainNumber) {
    throw new Error('Method getTrainRoute() not implemented.');
  }

  /**
   * Fetch berth availability and chart occupancy
   * @param {Object} _params
   * @param {string} _params.trainNumber
   * @param {string} _params.date
   * @param {string} _params.from
   * @param {string} _params.to
   * @param {string} [_params.travelClass]
   * @param {string} [_params.quota]
   * @returns {Promise<Object>}
   */
  async getAvailability(_params) {
    throw new Error('Method getAvailability() not implemented.');
  }

  /**
   * Fetch coach layout with berth allocations
   * @param {string} _trainNumber
   * @param {string} _date
   * @param {string} _coachId
   * @returns {Promise<Object|null>}
   */
  async getCoachLayout(_trainNumber, _date, _coachId) {
    throw new Error('Method getCoachLayout() not implemented.');
  }
}
