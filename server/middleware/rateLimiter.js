import { errorResponse } from '../utils/apiResponse.js';

/**
 * In-memory sliding window rate limiter for Vercel/serverless environments.
 * Prevents API abuse and controls downstream Gemini & Provider costs.
 */
class MemoryRateLimiter {
  constructor() {
    this.hits = new Map();
  }

  /**
   * Check rate limit
   * @param {string} key - Client identifier (e.g. IP + endpoint)
   * @param {number} maxRequests - Maximum requests allowed in window
   * @param {number} windowMs - Window duration in milliseconds
   * @returns {{ allowed: boolean, remaining: number, resetSeconds: number }}
   */
  check(key, maxRequests, windowMs) {
    const now = Date.now();
    let record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
      this.hits.set(key, record);
    }

    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
    const allowed = record.count <= maxRequests;

    // Periodic cleanup of stale records
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits.entries()) {
        if (now > v.resetTime) this.hits.delete(k);
      }
    }

    return { allowed, remaining, resetSeconds };
  }

  /**
   * Reset rate limiter state (useful for test isolation)
   */
  clear() {
    this.hits.clear();
  }
}

export const memoryRateLimiter = new MemoryRateLimiter();

/**
 * Rate limiting middleware factory
 * @param {Object} options
 * @param {number} options.max - Max requests in window
 * @param {number} options.windowMs - Window duration in ms
 * @param {string} [options.policyName="api"] - Identifier for policy
 */
export function createRateLimiter({ max, windowMs, policyName = 'api' }) {
  return (req, res, next) => {
    // In production, respect x-forwarded-for from reverse proxy / Vercel
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const limiterKey = `${policyName}:${clientIp}`;
    const { allowed, remaining, resetSeconds } = memoryRateLimiter.check(
      limiterKey,
      max,
      windowMs
    );

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (!allowed) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json(
        errorResponse(
          'RATE_LIMIT_EXCEEDED',
          `Too many requests for ${policyName}. Please wait ${resetSeconds} seconds before trying again.`,
          { retryAfterSeconds: resetSeconds }
        )
      );
    }

    next();
  };
}

// Preset rate limiting policies
export const stationSearchLimiter = createRateLimiter({
  policyName: 'stations',
  max: 120,
  windowMs: 60 * 1000, // 120 per minute
});

export const trainSearchLimiter = createRateLimiter({
  policyName: 'trains',
  max: 60,
  windowMs: 60 * 1000, // 60 per minute
});

export const availabilityLimiter = createRateLimiter({
  policyName: 'availability',
  max: 30,
  windowMs: 60 * 1000, // 30 per minute
});

export const aiExplainLimiter = createRateLimiter({
  policyName: 'ai-explain',
  max: 6,
  windowMs: 60 * 1000, // Strict 6 per minute for Gemini cost control
});
