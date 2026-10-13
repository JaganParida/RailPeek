import { Router } from 'express';
import { coachVacancyQuerySchema } from '../validators/coach.validator.js';
import { getCoachVacancy, getTrainCoachesSummary } from '../services/coach.service.js';
import {
  fetchLiveTrainComposition,
  fetchLiveVacantBerths,
  fetchLiveCoachComposition,
} from '../services/irctcLive.service.js';
import { trainSearchLimiter } from '../middleware/rateLimiter.js';
import { successResponse, ApiError } from '../utils/apiResponse.js';

export const coachRouter = Router();

/**
 * POST /api/v1/coaches/irctc/trainComposition
 */
coachRouter.post('/irctc/trainComposition', trainSearchLimiter, async (req, res, next) => {
  try {
    const { trainNo, jDate, boardingStation } = req.body || {};
    const result = await fetchLiveTrainComposition(trainNo, jDate, boardingStation);
    return res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/coaches/irctc/vacantBerth
 */
coachRouter.post('/irctc/vacantBerth', trainSearchLimiter, async (req, res, next) => {
  try {
    const result = await fetchLiveVacantBerths(req.body || {});
    return res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/coaches/irctc/coachComposition
 */
coachRouter.post('/irctc/coachComposition', trainSearchLimiter, async (req, res, next) => {
  try {
    const result = await fetchLiveCoachComposition(req.body || {});
    return res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/coaches/:trainNumber
 * GET /api/v1/coaches/:trainNumber/summary
 * Get available coaches and train details
 */
coachRouter.get(['/:trainNumber', '/:trainNumber/summary'], trainSearchLimiter, async (req, res, next) => {
  try {
    const { trainNumber } = req.params;
    if (!trainNumber) {
      throw new ApiError('MISSING_PARAMETER', 'Train number is required', 400);
    }

    const summary = await getTrainCoachesSummary(trainNumber, {
      from: req.query.from,
      to: req.query.to,
      date: req.query.date,
    });
    return res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/coaches/:trainNumber/:coachId
 * Get coach layout and evaluated journey vacancy
 */
coachRouter.get('/:trainNumber/:coachId', trainSearchLimiter, async (req, res, next) => {
  try {
    const rawParams = {
      trainNumber: req.params.trainNumber,
      coachId: req.params.coachId,
      date: req.query.date,
      from: req.query.from,
      to: req.query.to,
      travelClass: req.query.class || req.query.travelClass,
    };

    const validated = coachVacancyQuerySchema.parse(rawParams);

    if (validated.from && validated.to && validated.from === validated.to) {
      throw new ApiError(
        'INVALID_JOURNEY',
        'Boarding and deboarding stations cannot be identical',
        400
      );
    }

    const result = await getCoachVacancy({
      trainNumber: validated.trainNumber,
      coachId: validated.coachId,
      date: validated.date,
      from: validated.from,
      to: validated.to,
      travelClass: validated.travelClass,
    });

    const isCached = result.cached;
    delete result.cached;

    return res.json(
      successResponse(result, {
        cached: Boolean(isCached),
        source: result.source,
      })
    );
  } catch (err) {
    next(err);
  }
});
