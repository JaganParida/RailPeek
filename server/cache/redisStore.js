/**
 * High-performance, resilient Redis Client Integration for RailPeek.
 * Supports standard Redis, Upstash Redis, Redis Cloud, and local Redis.
 *
 * Operational Resilience:
 * - Lazy connection (does not block serverless cold starts or app boot)
 * - Auto-reconnect with exponential backoff & max retry limits
 * - Non-crashing graceful degradation: if Redis is offline or unconfigured,
 *   falls back seamlessly to in-memory LRU + MongoDB Atlas TTL snapshots.
 */

import Redis from 'ioredis';

let redisInstance = null;
let isConnected = false;
let isConnecting = false;

function resolveRedisUrl() {
  return (
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.REDIS_TLS_URL ||
    ''
  ).trim();
}

/**
 * Returns the singleton Redis client instance or null if unconfigured.
 * @returns {Redis|null}
 */
export function getRedisClient() {
  if (redisInstance) return redisInstance;

  const redisUrl = resolveRedisUrl();
  if (!redisUrl) {
    return null;
  }

  // Prevent connecting during unit test suite unless explicitly requested
  if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && !process.env.TEST_REDIS) {
    return null;
  }

  try {
    const isTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');

    redisInstance = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      commandTimeout: 3000,
      enableOfflineQueue: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 3) {
          // Stop retrying to prevent connection storms; fallback gracefully
          return null;
        }
        return Math.min(times * 300, 1500);
      },
    });

    redisInstance.on('connect', () => {
      isConnected = true;
      isConnecting = false;
      const masked = redisUrl.replace(/\/\/.*@/, '//***:***@');
      console.log(`[RailPeek Redis] Connected successfully to Redis cluster: ${masked}`);
    });

    redisInstance.on('ready', () => {
      isConnected = true;
    });

    redisInstance.on('close', () => {
      isConnected = false;
    });

    redisInstance.on('error', (err) => {
      isConnected = false;
      isConnecting = false;
      // Warn without crashing
      console.warn(`[RailPeek Redis] Connection notice: ${err.message}. Operating in fallback mode.`);
    });

    // Initiate connection asynchronously
    if (!isConnecting) {
      isConnecting = true;
      redisInstance.connect().catch((err) => {
        isConnected = false;
        isConnecting = false;
        console.warn(`[RailPeek Redis] Initial connect failed: ${err.message}. Falling back.`);
      });
    }

    return redisInstance;
  } catch (err) {
    console.warn(`[RailPeek Redis] Initialization skipped: ${err.message}`);
    return null;
  }
}

/**
 * Check if Redis is connected and ready to process commands.
 * @returns {boolean}
 */
export function isRedisReady() {
  const client = getRedisClient();
  return Boolean(client && isConnected && client.status === 'ready');
}

/**
 * Retrieve raw string from Redis
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function redisGet(key) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return null;
    return await client.get(key);
  } catch {
    return null;
  }
}

/**
 * Set string in Redis with TTL in seconds
 * @param {string} key
 * @param {string} value
 * @param {number} ttlSeconds
 * @returns {Promise<boolean>}
 */
export async function redisSet(key, value, ttlSeconds = 60) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return false;
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    await client.set(key, value, 'EX', ttl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete key from Redis
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function redisDel(key) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return false;
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      redisInstance.disconnect();
    } finally {
      redisInstance = null;
      isConnected = false;
    }
  }
}
