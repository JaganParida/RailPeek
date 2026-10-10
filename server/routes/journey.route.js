import { Router } from 'express';
import { findBerthsQuerySchema } from '../validators/journey.validator.js';
import { findUsableBerths } from '../services/journey.service.js';
import { availabilityLimiter } from '../middleware/rateLimiter.js';
import { successResponse } from '../utils/apiResponse.js';

export const journeyRouter = Router();

journeyRouter.get('/find-berths', availabilityLimiter, async (req, res, next) => {
  try {
    const validated = findBerthsQuerySchema.parse(req.query);

    const result = await findUsableBerths({
      from: validated.from,
      to: validated.to,
      date: validated.date,
      passengers: validated.passengers,
      train: validated.train,
      travelClass: validated.class,
      berthPreference: validated.preference,
      sameCoach: validated.sameCoach,
      sameBay: validated.sameBay,
      sortBy: validated.sortBy,
      checkNextDay: validated.checkNextDay,
      crossClass: validated.crossClass,
    });

    const meta = result.meta;
    delete result.meta;

    return res.json(successResponse(result, meta));
  } catch (err) {
    next(err);
  }
});

journeyRouter.post('/find-berths', availabilityLimiter, async (req, res, next) => {
  try {
    const validated = findBerthsQuerySchema.parse(req.body);

    const result = await findUsableBerths({
      from: validated.from,
      to: validated.to,
      date: validated.date,
      passengers: validated.passengers,
      train: validated.train,
      travelClass: validated.class,
      berthPreference: validated.preference,
      sameCoach: validated.sameCoach,
      sameBay: validated.sameBay,
      sortBy: validated.sortBy,
      checkNextDay: validated.checkNextDay,
      crossClass: validated.crossClass,
    });

    const meta = result.meta;
    delete result.meta;

    return res.json(successResponse(result, meta));
  } catch (err) {
    next(err);
  }
});
