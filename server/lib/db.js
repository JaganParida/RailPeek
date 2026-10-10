import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/env.js';

// Configure reliable DNS servers for Atlas shard resolution on Windows / local dev
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

/**
 * Global cache across serverless warm lambdas in Vercel.
 */
let cached = global.__railpeekMongoose;

if (!cached) {
  cached = global.__railpeekMongoose = { conn: null, promise: null };
}

/**
 * Serverless-safe MongoDB connection manager.
 * Reuses existing connection across warm invocations.
 *
 * @returns {Promise<typeof mongoose | null>}
 */
export async function connectDB() {
  if (!env.MONGODB_URI) {
    // If no URI configured, return null gracefully without throwing
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[RailPeek DB] Connection error:', err.message);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('[RailPeek DB] Failed awaiting connection promise:', e.message);
    return null;
  }

  return cached.conn;
}

/**
 * Get current database connection state.
 * @returns {"connected"|"connecting"|"disconnecting"|"disconnected"|"unconfigured"}
 */
export function getDBStatus() {
  if (!env.MONGODB_URI) return 'unconfigured';
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'disconnected';
}
