import mongoose from 'mongoose';
import { redisGet, redisSet, redisDel } from './redisStore.js';

/**
 * Serverless-compatible Mongoose Schema for durable snapshot caching across cold lambdas.
 */
const CacheSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    source: { type: String, default: 'cache' },
    fetchedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '0s' } }, // MongoDB TTL Index!
    staleAt: { type: Date, required: true },
  },
  { timestamps: true }
);

let CacheSnapshotModel = null;
function getCacheSnapshotModel() {
  if (mongoose.connection.readyState === 1) {
    if (!CacheSnapshotModel) {
      CacheSnapshotModel =
        mongoose.models.CacheSnapshot || mongoose.model('CacheSnapshot', CacheSnapshotSchema);
    }
    return CacheSnapshotModel;
  }
  return null;
}

/**
 * High-performance Multi-Tier Cache Store:
 * Tier 1: In-memory LRU Map (0ms latency, local process)
 * Tier 2: Redis Distributed Cache (sub-millisecond latency, cluster/serverless shared)
 * Tier 3: MongoDB Atlas TTL Collection (durable persistent fallback)
 */
export class CacheStore {
  constructor(maxEntries = 2000) {
    this.maxEntries = maxEntries;
    this.memory = new Map();
  }

  /**
   * Retrieve cached item across Tier 1 (Memory) -> Tier 2 (Redis) -> Tier 3 (MongoDB)
   * @param {string} key
   * @returns {Promise<{ data: any, isStale: boolean, isExpired: boolean, fetchedAt: string, source: string }|null>}
   */
  async get(key) {
    const now = Date.now();

    // 1. Tier 1: Check in-memory Map first (0ms latency)
    if (this.memory.has(key)) {
      const entry = this.memory.get(key);

      if (now > entry.expiresAt) {
        // Expired completely
        this.memory.delete(key);
      } else {
        // Refresh LRU recency on access
        this.memory.delete(key);
        this.memory.set(key, entry);

        const isStale = now > entry.staleAt;
        return {
          data: entry.data,
          isStale,
          isExpired: false,
          fetchedAt: new Date(entry.fetchedAt).toISOString(),
          source: entry.source || 'cache',
        };
      }
    }

    // 2. Tier 2: Check Redis (distributed cluster cache)
    try {
      const redisRaw = await redisGet(key);
      if (redisRaw) {
        const parsed = JSON.parse(redisRaw);
        if (parsed && parsed.data !== undefined) {
          const isStale = now > (parsed.staleAt || parsed.expiresAt);
          // Warm local in-memory LRU
          this.setMemoryOnly(key, parsed.data, {
            fetchedAt: parsed.fetchedAt || now,
            expiresAt: parsed.expiresAt || now + 60000,
            staleAt: parsed.staleAt || now + 30000,
            source: parsed.source || 'redis',
          });

          return {
            data: parsed.data,
            isStale,
            isExpired: false,
            fetchedAt: new Date(parsed.fetchedAt || now).toISOString(),
            source: parsed.source || 'redis',
          };
        }
      }
    } catch {
      // Non-blocking fallback to Tier 3
    }

    // 3. Tier 3: Check durable MongoDB snapshot if connected
    try {
      const Model = getCacheSnapshotModel();
      if (Model) {
        const doc = await Model.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
        if (doc) {
          const isStale = now > new Date(doc.staleAt).getTime();
          // Warm memory and Redis
          this.setMemoryOnly(key, doc.data, {
            fetchedAt: new Date(doc.fetchedAt).getTime(),
            expiresAt: new Date(doc.expiresAt).getTime(),
            staleAt: new Date(doc.staleAt).getTime(),
            source: doc.source,
          });

          const remainingTtlSeconds = Math.max(
            1,
            Math.floor((new Date(doc.expiresAt).getTime() - now) / 1000)
          );
          redisSet(
            key,
            JSON.stringify({
              data: doc.data,
              source: doc.source || 'mongodb',
              fetchedAt: new Date(doc.fetchedAt).getTime(),
              expiresAt: new Date(doc.expiresAt).getTime(),
              staleAt: new Date(doc.staleAt).getTime(),
            }),
            remainingTtlSeconds
          ).catch(() => {});

          return {
            data: doc.data,
            isStale,
            isExpired: false,
            fetchedAt: new Date(doc.fetchedAt).toISOString(),
            source: doc.source || 'cache',
          };
        }
      }
    } catch (err) {
      console.warn(`[RailPeek Cache] Error reading MongoDB snapshot: ${err.message}`);
    }

    return null;
  }

  /**
   * Put item in cache across all tiers (Memory + Redis + MongoDB)
   * @param {string} key
   * @param {any} data
   * @param {Object|number} options
   * @param {number} [options.ttlSeconds=60]
   * @param {number} [options.staleSeconds]
   * @param {string} [options.source="live"]
   */
  async set(key, data, options = {}) {
    const opts = typeof options === 'number' ? { ttlSeconds: options } : options || {};
    const now = Date.now();
    const ttlSeconds = Number(opts.ttlSeconds) || 60;
    const staleSeconds = Number(opts.staleSeconds) || Math.floor(ttlSeconds / 2);
    const source = opts.source || 'live';
    const expiresAt = now + ttlSeconds * 1000;
    const staleAt = now + staleSeconds * 1000;

    // 1. Tier 1: Write to in-memory store with LRU eviction guard
    this.setMemoryOnly(key, data, {
      fetchedAt: now,
      expiresAt,
      staleAt,
      source,
    });

    // 2. Tier 2: Asynchronously write to Redis (distributed tier)
    const redisPayload = JSON.stringify({
      data,
      source,
      fetchedAt: now,
      expiresAt,
      staleAt,
    });
    redisSet(key, redisPayload, ttlSeconds).catch(() => {});

    // 3. Tier 3: Asynchronously persist to MongoDB with TTL index if connected
    try {
      const Model = getCacheSnapshotModel();
      if (Model) {
        Model.findOneAndUpdate(
          { key },
          {
            key,
            data,
            source,
            fetchedAt: new Date(now),
            expiresAt: new Date(expiresAt),
            staleAt: new Date(staleAt),
          },
          { upsert: true, new: true }
        ).catch((err) => {
          console.warn(`[RailPeek Cache] Background Mongo write error: ${err.message}`);
        });
      }
    } catch {
      // Fire-and-forget; never block the request on background write
    }
  }

  /**
   * Set memory store entry with LRU bound
   */
  setMemoryOnly(key, data, { fetchedAt, expiresAt, staleAt, source }) {
    if (this.memory.has(key)) {
      this.memory.delete(key);
    } else if (this.memory.size >= this.maxEntries) {
      // Evict oldest (least recently used) entry
      const firstKey = this.memory.keys().next().value;
      if (firstKey !== undefined) {
        this.memory.delete(firstKey);
      }
    }

    this.memory.set(key, {
      key,
      data,
      fetchedAt,
      expiresAt,
      staleAt,
      source,
    });
  }

  /**
   * Delete entry from all tiers
   * @param {string} key
   */
  async delete(key) {
    this.memory.delete(key);
    redisDel(key).catch(() => {});
    try {
      const Model = getCacheSnapshotModel();
      if (Model) {
        Model.deleteOne({ key }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Clear in-memory cache
   */
  clear() {
    this.memory.clear();
  }

  get size() {
    return this.memory.size;
  }
}

export const cacheStore = new CacheStore(2000);
