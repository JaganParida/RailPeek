import { Router } from 'express';
import { explainRequestSchema } from '../validators/explain.validator.js';
import { explainJourneyOption } from '../services/gemini.service.js';
import { aiExplainLimiter } from '../middleware/rateLimiter.js';
import { successResponse } from '../utils/apiResponse.js';

export const explainRouter = Router();

/**
 * POST /api/v1/explain
 * Generate natural language journey/berth explanation
 */
explainRouter.post('/', aiExplainLimiter, async (req, res, next) => {
  try {
    const validatedData = explainRequestSchema.parse(req.body);
    const result = await explainJourneyOption(validatedData);

    const isCached = result.cached;
    delete result.cached;

    return res.json(
      successResponse(result, {
        cached: Boolean(isCached),
        source: result.source,
        isAiGenerated: result.isAiGenerated,
      })
    );
  } catch (err) {
    next(err);
  }
});
