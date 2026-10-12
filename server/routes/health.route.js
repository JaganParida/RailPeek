import { Router } from 'express';
import { env } from '../config/env.js';
import { getDBStatus } from '../lib/db.js';
import { successResponse } from '../utils/apiResponse.js';
import { metricsService } from '../services/metrics.service.js';
import { providerCircuitBreaker } from '../services/circuitBreaker.js';
import { getProviderHealth } from '../providers/index.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const metrics = metricsService.getSnapshot();
  const circuit = providerCircuitBreaker.getState();
  const providerHealth = getProviderHealth();

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

healthRouter.get('/diag', async (req, res) => {
  const result = {
    env: process.env.NODE_ENV,
    composition: null,
    vacantBerth: null,
  };

  try {
    const compRes = await fetch('https://www.irctc.co.in/online-charts/api/trainComposition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.irctc.co.in/online-charts/',
        'Origin': 'https://www.irctc.co.in',
      },
      body: JSON.stringify({
        trainNo: '12815',
        jDate: '2026-10-12',
        boardingStation: 'BBS',
      }),
    });
    result.composition = {
      status: compRes.status,
      statusText: compRes.statusText,
      data: compRes.ok ? await compRes.json() : await compRes.text(),
    };
  } catch (err) {
    result.composition = { error: err.message };
  }

  try {
    const vacRes = await fetch('https://www.irctc.co.in/online-charts/api/vacantBerth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.irctc.co.in/online-charts/',
        'Origin': 'https://www.irctc.co.in',
      },
      body: JSON.stringify({
        trainNo: '12815',
        jDate: '2026-10-12',
        boardingStation: 'BBS',
        remoteStation: 'PURI',
        trainSourceStation: 'PURI',
        cls: 'SL',
        chartType: 1,
      }),
    });
    result.vacantBerth = {
      status: vacRes.status,
      statusText: vacRes.statusText,
      data: vacRes.ok ? { count: (await vacRes.json()).vbd?.length } : await vacRes.text(),
    };
  } catch (err) {
    result.vacantBerth = { error: err.message };
  }

  return res.json(result);
});
