import { Router } from 'express';
import { resolvePnrStatus, isValidPnr } from '../services/pnr.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const pnrRouter = Router();

/**
 * GET /api/v1/pnr/:pnrNumber
 * Resolves 10-digit PNR status, confirmation predictions, and cancellation refund radar
 */
pnrRouter.get('/:pnrNumber', async (req, res) => {
  const { pnrNumber } = req.params;

  if (!isValidPnr(pnrNumber)) {
    return res.status(400).json(
      errorResponse(
        'INVALID_PNR',
        'Invalid PNR number. PNR must be a 10-digit numeric code.',
        400
      )
    );
  }

  try {
    const force = req.query.force === 'true' || req.query.refresh === 'true';
    const data = await resolvePnrStatus(pnrNumber, { force });
    return res.json(successResponse(data));
  } catch (err) {
    const msg = err.message || 'Failed to resolve PNR.';
    const isGatewayBusy = msg.includes('longer than usual') || msg.includes('temporarily') || msg.includes('reported:');
    const statusCode = isGatewayBusy ? 503 : 400;
    const errorCode = isGatewayBusy ? 'RAILWAY_GATEWAY_BUSY' : 'PNR_RESOLUTION_ERROR';
    return res.status(statusCode).json(
      errorResponse(errorCode, msg, statusCode)
    );
  }
});
