import { ApiError } from './apiResponse.js';

/**
 * Determine if an error is considered transient and safe for bounded retry.
 * @param {Error|any} error
 * @returns {boolean}
 */
export function isTransientError(error) {
  if (!error) return false;

  // Domain ApiErrors with 4xx status are permanent client errors — NEVER retry
  if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
    return false;
  }

  // Zod validation errors are permanent — NEVER retry
  if (error.name === 'ZodError') {
    return false;
  }

  // Network or socket-level transient errors
  const code = error.code || error.cause?.code;
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(code)) {
    return true;
  }

  // Upstream 5xx server errors or timeouts
  if (error.statusCode >= 500 || error.status >= 500) {
    return true;
  }

  const msg = String(error.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('econnreset')) {
    return true;
  }

  return false;
}

/**
 * Execute an async function with bounded exponential backoff retry.
 *
 * @template T
 * @param {() => Promise<T>} fn - Worker function to execute
 * @param {Object} [options]
 * @param {number} [options.maxRetries=2] - Maximum number of retries (total attempts = maxRetries + 1)
 * @param {number} [options.initialDelayMs=200] - Initial backoff delay in ms
 * @param {number} [options.maxDelayMs=1500] - Cap on exponential delay in ms
 * @param {AbortSignal} [options.signal] - Optional AbortSignal to cancel remaining retries
 * @param {(err: any) => boolean} [options.shouldRetry=isTransientError]
 * @returns {Promise<T>}
 */
export async function withRetry(
  fn,
  {
    maxRetries = 2,
    initialDelayMs = 200,
    maxDelayMs = 1500,
    signal,
    shouldRetry = isTransientError,
  } = {}
) {
  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      throw new ApiError('REQUEST_ABORTED', 'Operation was aborted before completion.', 499);
    }

    try {
      return await fn();
    } catch (err) {
      attempt++;

      // Check if retry budget is exhausted or error is non-retryable
      if (attempt > maxRetries || !shouldRetry(err)) {
        throw err;
      }

      // Calculate exponential backoff with slight jitter to prevent thundering herds
      const jitter = Math.floor(Math.random() * 50);
      const delay = Math.min(maxDelayMs, initialDelayMs * Math.pow(2, attempt - 1) + jitter);

      console.warn(
        `[RailPeek Retry] Transient failure on attempt ${attempt}/${maxRetries + 1}: ${err.message}. Retrying in ${delay}ms...`
      );

      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (signal) {
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              reject(new ApiError('REQUEST_ABORTED', 'Operation was aborted during retry backoff.', 499));
            },
            { once: true }
          );
        }
      });
    }
  }
}
