import { Router } from 'express';
import { z } from 'zod';
import { getRailwayProvider } from '../providers/index.js';
import { trainSearchLimiter } from '../middleware/rateLimiter.js';
import { successResponse, ApiError } from '../utils/apiResponse.js';

export const trainsRouter = Router();

const searchTrainsSchema = z.object({
  from: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Origin station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  to: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Destination station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
});

trainsRouter.get('/search', trainSearchLimiter, async (req, res, next) => {
  try {
    const { from, to, date } = searchTrainsSchema.parse(req.query);

    if (from === to) {
      throw new ApiError('INVALID_JOURNEY', 'Origin and destination stations cannot be identical', 400);
    }

    const provider = getRailwayProvider();
    const trains = await provider.searchTrains(from, to, date);
    return res.json(
      successResponse(trains, {
        from,
        to,
        date,
        count: trains.length,
        source: provider.name === 'MockRailwayProvider' ? 'demo' : 'live',
      })
    );
  } catch (err) {
    next(err);
  }
});

trainsRouter.get('/:trainNumber/route', async (req, res, next) => {
  try {
    const trainNumber = req.params.trainNumber;
    if (!/^\d{5}$/.test(trainNumber)) {
      throw new ApiError('INVALID_TRAIN_NUMBER', 'Train number must be 5 digits', 400);
    }

    const provider = getRailwayProvider();
    const routeData = await provider.getTrainRoute(trainNumber);
    if (!routeData) {
      throw new ApiError('TRAIN_NOT_FOUND', `Train ${trainNumber} not found in schedule database`, 404);
    }

    return res.json(successResponse(routeData));
  } catch (err) {
    next(err);
  }
});
