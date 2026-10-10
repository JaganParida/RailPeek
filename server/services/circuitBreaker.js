import { ApiError } from '../utils/apiResponse.js';

/**
 * Circuit Breaker implementation for External Railway Provider protection.
 * Prevents hammering a degraded upstream provider during outages.
 */
export class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {number} [options.failureThreshold=5] - Number of consecutive errors before opening circuit
   * @param {number} [options.cooldownMs=30000] - Duration in ms before transitioning from OPEN to HALF_OPEN
   */
  constructor({ failureThreshold = 5, cooldownMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;

    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    this.canaryInFlight = false;
  }

  /**
   * Execute protected provider call through the circuit breaker
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async execute(fn) {
    const now = Date.now();

    // 1. If OPEN, check if cooldown has elapsed
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.cooldownMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ApiError(
          'PROVIDER_CIRCUIT_OPEN',
          'Railway provider is temporarily unavailable due to upstream degradation. Please try again shortly.',
          503
        );
      }
    }

    // 2. If HALF_OPEN, permit only ONE canary test request
    if (this.state === 'HALF_OPEN') {
      if (this.canaryInFlight) {
        throw new ApiError(
          'PROVIDER_CIRCUIT_OPEN',
          'Railway provider recovery test is in progress. Please retry in a few seconds.',
          503
        );
      }
      this.canaryInFlight = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    } finally {
      if (this.state === 'HALF_OPEN' || this.canaryInFlight) {
        this.canaryInFlight = false;
      }
    }
  }

  onSuccess() {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
    this.canaryInFlight = false;
  }

  onFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    this.state = 'OPEN';
    this.canaryInFlight = false;
  }

  reset() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    this.canaryInFlight = false;
  }

  getState() {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      canaryInFlight: this.canaryInFlight,
    };
  }
}

export const providerCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30000,
});
