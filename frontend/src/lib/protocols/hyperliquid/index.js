/**
 * Hyperliquid Protocol Integration
 * Main entry point for all Hyperliquid related functionality
 */

export { default as hyperliquidDataService } from './dataService';

export const HYPERLIQUID_CONFIG = {
  name: 'Hyperliquid',
  id: 'hyperliquid',
  baseUrl: '/api/hyperliquid',
  apiBaseUrl: 'https://api.hyperliquid.xyz',
  description: 'Decentralized perpetual futures exchange',
  features: [
    'Perpetual futures',
    'Real-time funding rates',
    'Orderbook data',
    'Historical funding data',
    '24h statistics'
  ],
  supportedEndpoints: [
    'allMids',
    'meta',
    'metaAndAssetCtxs',
    'l2Book',
    'recentTrades',
    'fundingHistory'
  ]
};
