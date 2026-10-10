import { RailwayProvider } from './RailwayProvider.js';
import { MOCK_STATIONS } from '../mockData/stations.mock.js';
import { MOCK_TRAINS } from '../mockData/trains.mock.js';
import { MOCK_ROUTES } from '../mockData/routes.mock.js';
import { generateCoachBerths, getCoachClass } from '../mockData/coaches.mock.js';
import { MOCK_BERTH_OCCUPANCIES } from '../mockData/availability.mock.js';
import { evaluateCoachBerths, resolveJourneySegment } from '../engine/segmentEngine.js';
import { evaluateChartStatus } from '../utils/chartStatus.js';

export class MockRailwayProvider extends RailwayProvider {
  constructor() {
    super('MockRailwayProvider');
  }

  /**
   * Search stations across all Indian Railway stations with intelligent ranking
   */
  async searchStations(query, limit = 10) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toUpperCase();

    const scored = [];
    for (let i = 0; i < MOCK_STATIONS.length; i++) {
      const s = MOCK_STATIONS[i];
      const code = s.code.toUpperCase();
      const name = s.name.toUpperCase();
      const city = (s.city || '').toUpperCase();
      const aliases = (s.aliases || []).map((a) => a.toUpperCase());
      const isMajor = Boolean(s.isMajor);

      let score = 0;
      if (code === q) {
        score = isMajor ? 1500 : 1000;
      } else if (isMajor && name.startsWith(q)) {
        score = 1200;
      } else if (isMajor && aliases.some((a) => a === q)) {
        score = 1100;
      } else if (code.startsWith(q)) {
        score = 800 - (code.length - q.length) * 10 + (isMajor ? 50 : 0);
      } else if (name === q) {
        score = 700 + (isMajor ? 50 : 0);
      } else if (name.startsWith(q)) {
        score = 600 + (isMajor ? 50 : 0);
      } else if (aliases.some((a) => a === q)) {
        score = 550 + (isMajor ? 50 : 0);
      } else if (city.startsWith(q)) {
        score = 500 + (isMajor ? 50 : 0);
      } else if (name.split(/\s+/).some((w) => w.startsWith(q))) {
        score = 400 + (isMajor ? 50 : 0);
      } else if (aliases.some((a) => a.startsWith(q))) {
        score = 350 + (isMajor ? 50 : 0);
      } else if (code.includes(q)) {
        score = 200 + (isMajor ? 20 : 0);
      } else if (name.includes(q)) {
        score = 150 + (isMajor ? 20 : 0);
      } else if (city.includes(q)) {
        score = 100 + (isMajor ? 20 : 0);
      } else if (aliases.some((a) => a.includes(q))) {
        score = 80 + (isMajor ? 20 : 0);
      }

      if (score > 0) {
        score -= Math.min(name.length, 50) * 0.1;
        scored.push({ s, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ s }) => ({
      code: s.code,
      name: s.name,
      city: s.city,
      state: s.state,
      zone: s.zone,
      source: 'demo',
      isDemo: true,
    }));
  }

  /**
   * Get single station by code or alias
   */
  async getStation(code) {
    if (!code) return null;
    const upper = code.trim().toUpperCase();
    const s = MOCK_STATIONS.find(
      (st) =>
        st.code === upper ||
        (Array.isArray(st.aliases) && st.aliases.map((a) => a.toUpperCase()).includes(upper))
    );
    if (!s) return null;
    return {
      code: s.code,
      name: s.name,
      city: s.city,
      state: s.state,
      zone: s.zone,
      source: 'demo',
      isDemo: true,
    };
  }

  /**
   * Search trains connecting from and to stations
   */
  async searchTrains(from, to, date) {
    const fromCode = from?.toUpperCase();
    const toCode = to?.toUpperCase();

    const matchedTrains = [];

    let dayOfWeek = null;
    if (date && typeof date === 'string') {
      try {
        const parts = date.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0])) {
          const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
          dayOfWeek = dObj.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
        }
      } catch (_e) {
        // ignore parse error
      }
    }

    for (const train of MOCK_TRAINS) {
      // In production/dev, filter by operating days of run
      if (process.env.NODE_ENV !== 'test' && dayOfWeek !== null && Array.isArray(train.daysOfRun)) {
        if (!train.daysOfRun.includes(dayOfWeek)) {
          continue; // Train does not operate on this day of the week
        }
      }

      const route = MOCK_ROUTES[train.number];
      if (!route) continue;

      const fromStop = route.find((r) => r.stationCode === fromCode);
      const toStop = route.find((r) => r.stationCode === toCode);

      // Station order must be valid (fromStop before toStop)
      if (fromStop && toStop && fromStop.stopIndex < toStop.stopIndex) {
        matchedTrains.push({
          trainNumber: train.number,
          trainName: train.name,
          origin: train.origin,
          destination: train.destination,
          fromStation: fromStop.stationCode,
          fromStationName: fromStop.stationName,
          departureTime: fromStop.departure,
          toStation: toStop.stationCode,
          toStationName: toStop.stationName,
          arrivalTime: toStop.arrival,
          distanceKm: toStop.distanceKm - fromStop.distanceKm,
          classes: train.classes,
          daysOfRun: train.daysOfRun,
          journeyDate: date,
          source: 'demo',
          isDemo: true,
          chartStatus: evaluateChartStatus(date, fromStop.departure).chartStatus,
          chartLabel: evaluateChartStatus(date, fromStop.departure).chartLabel,
          chartDescription: evaluateChartStatus(date, fromStop.departure).chartDescription,
        });
      }
    }

    return matchedTrains;
  }

  /**
   * Get train route stops
   */
  async getTrainRoute(trainNumber) {
    const train = MOCK_TRAINS.find((t) => t.number === trainNumber);
    const route = MOCK_ROUTES[trainNumber];

    if (!train || !route) return null;

    return {
      train: { ...train, source: 'demo', isDemo: true },
      route: route.map((r) => ({ ...r, source: 'demo', isDemo: true })),
    };
  }

  /**
   * Get availability for a specific train and journey segment
   */
  async getAvailability({ trainNumber, date, from, to, travelClass = '3A', coach }) {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    const train = MOCK_TRAINS.find((t) => t.number === trainNumber);
    const route = MOCK_ROUTES[trainNumber];

    if (!train || !route) {
      return {
        trainNumber,
        journeyDate: date,
        from: fromCode,
        to: toCode,
        travelClass,
        berths: [],
        chartStatus: 'UNKNOWN',
        source: 'demo',
        isDemo: true,
        fetchedAt: new Date().toISOString(),
      };
    }

    const journey = resolveJourneySegment(route, fromCode, toCode);

    if (!journey.valid) {
      return {
        trainNumber,
        journeyDate: date,
        from: fromCode,
        to: toCode,
        travelClass,
        berths: [],
        chartStatus: 'UNKNOWN',
        source: 'demo',
        isDemo: true,
        fetchedAt: new Date().toISOString(),
      };
    }

    let selectedCoach = coach;
    let effectiveClass = travelClass;

    if (selectedCoach) {
      effectiveClass = getCoachClass(selectedCoach);
    } else {
      if (effectiveClass === 'SL') selectedCoach = 'S1';
      else if (effectiveClass === '2A') selectedCoach = 'A1';
      else if (effectiveClass === '1A') selectedCoach = 'H1';
      else if (effectiveClass === '2S') selectedCoach = 'D1';
      else if (effectiveClass === 'CC') selectedCoach = 'C1';
      else selectedCoach = trainNumber === '12801' ? 'B2' : trainNumber === '20817' ? 'B1' : 'B3';
    }

    const coachKey = `${trainNumber}:${selectedCoach}`;
    const baseBerths = generateCoachBerths(selectedCoach, effectiveClass);
    const occupancyProfiles = MOCK_BERTH_OCCUPANCIES[coachKey] || {};

    const { berths: evaluatedBerths } = evaluateCoachBerths({
      coachBerths: baseBerths,
      coachOccupancies: occupancyProfiles,
      routeStops: route,
      fromStation: fromCode,
      toStation: toCode,
      requestedClass: effectiveClass,
    });

    return {
      trainNumber,
      trainName: train.name,
      journeyDate: date,
      from: fromCode,
      to: toCode,
      travelClass: effectiveClass,
      coach: selectedCoach,
      berths: evaluatedBerths,
      chartStatus: evaluateChartStatus(date, train.departureTime).chartStatus,
      chartLabel: evaluateChartStatus(date, train.departureTime).chartLabel,
      chartDescription: evaluateChartStatus(date, train.departureTime).chartDescription,
      source: 'demo',
      isDemo: true,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Get coach layout
   */
  async getCoachLayout(trainNumber, date, coachId) {
    const travelClass = coachId.startsWith('A')
      ? '2A'
      : coachId.startsWith('H')
      ? '1A'
      : coachId.startsWith('S')
      ? 'SL'
      : coachId.startsWith('D')
      ? '2S'
      : coachId.startsWith('C')
      ? 'CC'
      : '3A';
    const berths = generateCoachBerths(coachId, travelClass);

    return {
      trainNumber,
      date,
      coachId,
      travelClass,
      berths,
      source: 'demo',
      isDemo: true,
      fetchedAt: new Date().toISOString(),
    };
  }
}
