import { env } from '../config/env.js';
import { MockRailwayProvider } from './MockRailwayProvider.js';
import { LiveRailwayProvider } from './LiveRailwayProvider.js';

let instance = null;

/**
 * Get active RailwayProvider singleton
 * @returns {import('./RailwayProvider.js').RailwayProvider}
 */
export function getRailwayProvider() {
  if (!instance) {
    if (env.RAILWAY_PROVIDER === 'live') {
      instance = new LiveRailwayProvider();
    } else {
      instance = new MockRailwayProvider();
    }
  }
  return instance;
}

/**
 * Manually set or override RailwayProvider (useful for testing or switching modes)
 * @param {import('./RailwayProvider.js').RailwayProvider} provider
 */
export function setRailwayProvider(provider) {
  instance = provider;
}

/**
 * Reset RailwayProvider to default environment singleton
 */
export function resetRailwayProvider() {
  instance = null;
}

/**
 * Get provider health metadata
 * @returns {Object}
 */
export function getProviderHealth() {
  const provider = getRailwayProvider();
  const isLive = provider.name === 'LiveRailwayProvider';
  const isConfigured = isLive ? provider.isConfigured() : true;
  const circuitState = isLive ? provider.circuitBreaker.getState().state : 'CLOSED';
  const fallbackEnabled = isLive ? Boolean(provider.fallbackToMock) : false;

  return {
    name: provider.name,
    isLive,
    isConfigured,
    circuitBreaker: circuitState,
    fallbackToMockEnabled: fallbackEnabled,
  };
}
