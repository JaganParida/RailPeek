/**
 * Standard API Response and Error utilities for RailPeek.
 */

export class ApiError extends Error {
  /**
   * @param {string} code - Machine-readable error code (e.g. 'INVALID_JOURNEY')
   * @param {string} message - User-friendly safe error message
   * @param {number} [statusCode=400] - HTTP status code
   * @param {any} [details=null] - Optional validation details
   */
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Format a successful API response
 * @param {any} data
 * @param {Record<string, any>} [meta]
 */
export function successResponse(data, meta) {
  const res = {
    success: true,
    data,
  };
  if (meta) {
    res.meta = meta;
  }
  return res;
}

/**
 * Format an error API response
 * @param {string} code
 * @param {string} message
 * @param {any} [details]
 */
export function errorResponse(code, message, details) {
  const err = {
    code,
    message,
  };
  if (details) {
    err.details = details;
  }
  return {
    success: false,
    error: err,
  };
}
