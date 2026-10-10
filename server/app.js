import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.route.js';
import { stationsRouter } from './routes/stations.route.js';
import { trainsRouter } from './routes/trains.route.js';
import { availabilityRouter } from './routes/availability.route.js';
import { journeyRouter } from './routes/journey.route.js';
import { coachRouter } from './routes/coach.route.js';
import { explainRouter } from './routes/explain.route.js';
import { pnrRouter } from './routes/pnr.route.js';
import { ApiError } from './utils/apiResponse.js';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';

export const app = express();

// Disable Express fingerprinting header
app.disable('x-powered-by');

// Hardened Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite SPA assets when served together
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' }, // Anti-clickjacking
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  })
);

// Secure CORS configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow server-to-server, curl, and tools without Origin header
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow configured client origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Allow Vercel preview and production deployments (*.vercel.app)
      if (
        /^https:\/\/[a-zA-Z0-9-]+(\.railpeek)?\.vercel\.app$/.test(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      // 4. In non-production, allow localhost on any port
      if (env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // 5. Block unauthorized origins
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
    maxAge: 86400,
  })
);

// Request parsing & IDs
app.use(express.json({ limit: '512kb' }));
app.use(requestIdMiddleware);

// Serverless lazy DB connect middleware (non-blocking for fast cold-starts)
app.use((req, res, next) => {
  if (env.MONGODB_URI && mongoose.connection.readyState === 0) {
    connectDB().catch((err) => {
      console.warn('[RailPeek Serverless] Lazy DB connect deferred:', err.message);
    });
  }
  next();
});

// API v1 Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/stations', stationsRouter);
app.use('/api/v1/trains', trainsRouter);
app.use('/api/v1/availability', availabilityRouter);
app.use('/api/v1/journey', journeyRouter);
app.use('/api/v1/coaches', coachRouter);
app.use('/api/v1/explain', explainRouter);
app.use('/api/v1/pnr', pnrRouter);

// Catch-all 404 for API routes
app.all('/api/*', (req, res, next) => {
  next(new ApiError('NOT_FOUND', `Route ${req.method} ${req.path} not found.`, 404));
});

// Global error handler
app.use(errorHandler);
