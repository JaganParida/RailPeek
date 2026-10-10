import { Router } from 'express';
import { z } from 'zod';
import { getRailwayProvider } from '../providers/index.js';
import { stationSearchLimiter } from '../middleware/rateLimiter.js';
import { successResponse, ApiError } from '../utils/apiResponse.js';

export const stationsRouter = Router();

const searchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(50),
  limit: z.coerce.number().min(1).max(50).default(10),
});

stationsRouter.get('/search', stationSearchLimiter, async (req, res, next) => {
  try {
    const { q, limit } = searchSchema.parse(req.query);
    const provider = getRailwayProvider();
    const stations = await provider.searchStations(q, limit);
    return res.json(successResponse(stations, { query: q, count: stations.length }));
  } catch (err) {
    next(err);
  }
});

stationsRouter.get('/:code', async (req, res, next) => {
  try {
    const code = req.params.code?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9]{2,10}$/.test(code)) {
      throw new ApiError('INVALID_STATION_CODE', 'Station code must be between 2 and 10 alphanumeric characters', 400);
    }
    const provider = getRailwayProvider();
    const station = await provider.getStation(code);
    if (!station) {
      throw new ApiError('STATION_NOT_FOUND', `Station with code ${code} was not found`, 404);
    }
    return res.json(successResponse(station));
  } catch (err) {
    next(err);
  }
});
