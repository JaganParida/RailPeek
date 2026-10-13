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

healthRouter.get('/test-direct-irctc', async (req, res) => {
  const startTime = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const targetUrl = 'https://www.irctc.co.in/online-charts/api/trainComposition';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const irctcRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.irctc.co.in/online-charts/',
        'Origin': 'https://www.irctc.co.in',
      },
      body: JSON.stringify({
        trainNo: '12801',
        jDate: today,
        boardingStation: 'PURI',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    const status = irctcRes.status;
    const headers = Object.fromEntries(irctcRes.headers.entries());
    const text = await irctcRes.text().catch(() => '');

    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_e) {
      // not json
    }

    return res.json({
      success: status === 200,
      directFromVercel: true,
      latencyMs,
      status,
      headers: {
        server: headers['server'],
        'content-type': headers['content-type'],
      },
      responseIsJson: Boolean(json),
      dataPreview: json
        ? { trainName: json.trainName, chartOneDate: json.chartOneDate, coachesCount: json.cdd?.length }
        : text.slice(0, 300),
    });
  } catch (err) {
    return res.json({
      success: false,
      directFromVercel: true,
      latencyMs: Date.now() - startTime,
      errorName: err.name,
      errorMessage: err.message,
    });
  }
});
