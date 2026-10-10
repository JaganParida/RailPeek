import mongoose from 'mongoose';

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
 * High-performance Cache Store supporting in-memory fast lookups,
 * Stale-While-Revalidate metadata, and MongoDB TTL durable persistence.
 */
export class CacheStore {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.memory = new Map();
  }

  /**
   * Retrieve cached item
   * @param {string} key
   * @returns {Promise<{ data: any, isStale: boolean, isExpired: boolean, fetchedAt: string, source: string }|null>}
   */
  async get(key) {
    const now = Date.now();

    // 1. Check in-memory Map first (0ms latency)
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

    // 2. Check durable MongoDB snapshot if connected
    try {
      const Model = getCacheSnapshotModel();
      if (Model) {
        const doc = await Model.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
        if (doc) {
          const isStale = now > new Date(doc.staleAt).getTime();
          // Warm the memory cache with retrieved durable record
          this.setMemoryOnly(key, doc.data, {
            fetchedAt: new Date(doc.fetchedAt).getTime(),
            expiresAt: new Date(doc.expiresAt).getTime(),
            staleAt: new Date(doc.staleAt).getTime(),
            source: doc.source,
          });

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
   * Put item in cache
   * @param {string} key
   * @param {any} data
   * @param {Object} options
   * @param {number} options.ttlSeconds
   * @param {number} options.staleSeconds
   * @param {string} [options.source="live"]
   */
  async set(key, data, options = {}) {
    const opts = typeof options === 'number' ? { ttlSeconds: options } : (options || {});
    const now = Date.now();
    const ttlSeconds = Number(opts.ttlSeconds) || 60;
    const staleSeconds = Number(opts.staleSeconds) || Math.floor(ttlSeconds / 2);
    const source = opts.source || 'live';
    const expiresAt = now + ttlSeconds * 1000;
    const staleAt = now + staleSeconds * 1000;

    // 1. Write to in-memory store with LRU eviction guard
    this.setMemoryOnly(key, data, {
      fetchedAt: now,
      expiresAt,
      staleAt,
      source,
    });

    // 2. Asynchronously persist to MongoDB with TTL index if connected
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
   * Clear cache
   */
  clear() {
    this.memory.clear();
  }

  get size() {
    return this.memory.size;
  }
}

export const cacheStore = new CacheStore(2000);
