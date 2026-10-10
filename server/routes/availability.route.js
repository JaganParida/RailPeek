import { Router } from 'express';
import { availabilityQuerySchema } from '../validators/provider.validator.js';
import { getCachedAvailability } from '../services/availability.service.js';
import { availabilityLimiter } from '../middleware/rateLimiter.js';
import { successResponse, ApiError } from '../utils/apiResponse.js';

export const availabilityRouter = Router();

availabilityRouter.get('/', availabilityLimiter, async (req, res, next) => {
  try {
    const validatedQuery = availabilityQuerySchema.parse(req.query);

    if (validatedQuery.from === validatedQuery.to) {
      throw new ApiError(
        'INVALID_JOURNEY',
        'Boarding and destination stations cannot be identical',
        400
      );
    }

    const result = await getCachedAvailability({
      trainNumber: validatedQuery.trainNumber,
      date: validatedQuery.date,
      from: validatedQuery.from,
      to: validatedQuery.to,
      travelClass: validatedQuery.class,
      coach: validatedQuery.coach,
      quota: validatedQuery.quota,
      forceRefresh: validatedQuery.refresh === 'true',
    });

    const meta = result.meta;
    delete result.meta;

    return res.json(successResponse(result, meta));
  } catch (err) {
    next(err);
  }
});
