/**
 * Lightweight in-memory observability metrics tracker.
 * Tracks operational telemetry without sensitive data or secrets.
 */
class MetricsService {
  constructor() {
    this.counters = {
      requestsTotal: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheStaleHits: 0,
      coalescedRequests: 0,
      providerCalls: 0,
      providerFailures: 0,
      retriesTotal: 0,
      databaseCalls: 0,
    };

    this.latencies = [];
    this.startedAt = Date.now();
  }

  increment(metricName, count = 1) {
    if (metricName in this.counters) {
      this.counters[metricName] += count;
    }
  }

  recordLatency(ms) {
    if (typeof ms === 'number' && !isNaN(ms)) {
      this.latencies.push(ms);
      if (this.latencies.length > 500) {
        this.latencies.shift();
      }
    }
  }

  getSnapshot() {
    const totalRequests = this.counters.requestsTotal || 1;
    const hitRate = ((this.counters.cacheHits / totalRequests) * 100).toFixed(1);

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0;
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      hitRatePercent: Number(hitRate),
      counters: { ...this.counters },
      latencyMs: {
        p50,
        p95,
        samples: sorted.length,
      },
    };
  }

  reset() {
    for (const key of Object.keys(this.counters)) {
      this.counters[key] = 0;
    }
    this.latencies = [];
  }
}

export const metricsService = new MetricsService();
