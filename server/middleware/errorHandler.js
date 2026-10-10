import { ZodError } from 'zod';
import { ApiError, errorResponse } from '../utils/apiResponse.js';

/**
 * Global Express error handling middleware.
 * Ensures NO stack traces, internal paths, or DB credentials leak to the client.
 */
export function errorHandler(err, req, res, _next) {
  const reqId = req.id || 'unknown';

  // 1. Malformed JSON parsing error from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(
      errorResponse('INVALID_JSON', 'Malformed JSON payload in request body.')
    );
  }

  // 2. Request payload too large (exceeds 512kb)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json(
      errorResponse('PAYLOAD_TOO_LARGE', 'Request payload exceeds maximum allowed size (512kb).')
    );
  }

  // 3. Malformed URI component error
  if (err instanceof URIError) {
    return res.status(400).json(
      errorResponse('INVALID_URI', 'Malformed URI component in request parameters.')
    );
  }

  // 4. Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'The request parameters were invalid.', formatted)
    );
  }

  // 5. Custom Domain ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
  }

  // 6. Fallback for unhandled internal errors - log internally with requestId, return safe message
  console.error(`[RailPeek Error] [reqId: ${reqId}]`, err.message);
  return res.status(500).json(
    errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred. Please try again.')
  );
}
