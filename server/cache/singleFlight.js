/**
 * SingleFlight / Request Coalescing Engine.
 * Collapses concurrent in-flight requests for the identical cache key into a single
 * execution. When 100 users query the same train/date/route concurrently, only ONE
 * provider request is dispatched; all 100 callers receive the identical result.
 */

export class SingleFlight {
  constructor() {
    this.inFlight = new Map();
  }

  /**
   * Execute or join an existing in-flight promise for the canonical key.
   *
   * @template T
   * @param {string} key - Canonical cache key
   * @param {(signal: AbortSignal) => Promise<T>} fn - Provider fetch function receiving an AbortSignal
   * @param {number} [timeoutMs=10000] - Hard timeout limit
   * @returns {Promise<{ data: T, coalesced: boolean }>}
   */
  async do(key, fn, timeoutMs = 25000) {
    if (this.inFlight.has(key)) {
      // Join existing in-flight execution
      const existingPromise = this.inFlight.get(key);
      const data = await existingPromise;
      return { data, coalesced: true };
    }

    const controller = new AbortController();
    let timerId;

    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        controller.abort();
        reject(new Error(`SingleFlight timeout exceeded (${timeoutMs}ms) for key ${key}`));
      }, timeoutMs);
    });

    const executionPromise = (async () => {
      try {
        const result = await Promise.race([fn(controller.signal), timeoutPromise]);
        return result;
      } finally {
        clearTimeout(timerId);
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, executionPromise);

    try {
      const data = await executionPromise;
      return { data, coalesced: false };
    } catch (err) {
      this.inFlight.delete(key);
      throw err;
    }
  }

  /**
   * Get count of currently executing in-flight operations
   * @returns {number}
   */
  get activeCount() {
    return this.inFlight.size;
  }
}

export const singleFlight = new SingleFlight();
