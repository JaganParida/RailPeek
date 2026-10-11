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
      const pageRes = await fetch('https://www.irctc.co.in/online-charts/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const pageStatus = pageRes.status;
      const setCookies = pageRes.headers.get('set-cookie') || '';

      const postRes = await fetch('https://www.irctc.co.in/online-charts/api/trainComposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
          'Origin': 'https://www.irctc.co.in',
          'Referer': 'https://www.irctc.co.in/online-charts/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': setCookies,
        },
        body: JSON.stringify({ trainNo: '12875', jDate: '2026-10-11', boardingStation: 'BBS' }),
      });
      const postStatus = postRes.status;
      const postText = await postRes.text();

      irctcDiagnostic = {
        pageStatus,
        hasCookies: Boolean(setCookies),
        postStatus,
        postPreview: postText.slice(0, 200),
      };
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
