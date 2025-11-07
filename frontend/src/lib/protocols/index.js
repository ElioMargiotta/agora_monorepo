/**
 * Protocol Registry
 * Central registry for all supported protocols
 */

import { ASTER_CONFIG, asterDataService } from './aster';
import { HYPERLIQUID_CONFIG, hyperliquidDataService } from './hyperliquid';
import { DYDX_CONFIG, dydxDataService } from './dydx';
import { EXTENDED_CONFIG, rest as extendedRest, ws as extendedWs } from './extended';

// Registry of all protocols
export const PROTOCOLS = {
  aster: {
    config: ASTER_CONFIG,
    service: asterDataService,
    enabled: true
  },
  hyperliquid: {
    config: HYPERLIQUID_CONFIG,
    service: hyperliquidDataService,
    enabled: true // Now available
  },
  extended: {
    config: EXTENDED_CONFIG,
    service: {
      rest: extendedRest,
      ws: extendedWs
    },
    enabled: true
  },
  dydx: {
    config: DYDX_CONFIG,
    service: dydxDataService,
    enabled: false // Coming soon
  }
};

// Helper functions
export const getEnabledProtocols = () => {
  return Object.entries(PROTOCOLS)
    .filter(([_, protocol]) => protocol.enabled)
    .map(([id, protocol]) => ({ id, ...protocol }));
};

export const getProtocol = (protocolId) => {
  return PROTOCOLS[protocolId];
};

export const getProtocolService = (protocolId) => {
  const protocol = PROTOCOLS[protocolId];
  return protocol?.service;
};

export const getAllProtocolConfigs = () => {
  return Object.entries(PROTOCOLS).map(([id, protocol]) => ({
    id,
    ...protocol.config,
    enabled: protocol.enabled
  }));
};

// Default exports for convenience
export { asterDataService, hyperliquidDataService, dydxDataService };
export { rest as extendedRest, ws as extendedWs } from './extended';
