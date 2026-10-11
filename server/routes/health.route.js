import { Router } from 'express';
import { env } from '../config/env.js';
import { getDBStatus } from '../lib/db.js';
import { successResponse } from '../utils/apiResponse.js';
import { metricsService } from '../services/metrics.service.js';
import { providerCircuitBreaker } from '../services/circuitBreaker.js';
import { getProviderHealth } from '../providers/index.js';
import { fetchLiveTrainComposition } from '../services/irctcLive.service.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  const dbStatus = getDBStatus();
  const metrics = metricsService.getSnapshot();
  const circuit = providerCircuitBreaker.getState();
  const providerHealth = getProviderHealth();

  let irctcDiagnostic = null;
  if (req.query.checkIrctc === '1') {
    try {
      irctcDiagnostic = await fetchLiveTrainComposition('12875', '2026-10-11', 'BBS');
    } catch (e) {
      irctcDiagnostic = { caughtError: e.message };
    }
  }

  return res.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      provider: env.RAILWAY_PROVIDER,
      providerHealth,
      database: dbStatus,
      uptime: process.uptime(),
      uptimeSeconds: process.uptime(),
      circuitBreaker: circuit.state,
      irctcDiagnostic,
      telemetry: {
        hitRatePercent: metrics.hitRatePercent,
        requestsTotal: metrics.counters.requestsTotal,
        cacheHits: metrics.counters.cacheHits,
        cacheMisses: metrics.counters.cacheMisses,
        coalescedRequests: metrics.counters.coalescedRequests,
        providerCalls: metrics.counters.providerCalls,
        providerFailures: metrics.counters.providerFailures,
        latencyP50Ms: metrics.latencyMs.p50,
      },
    })
  );
});
