/**
 * Aster Finance Protocol Integration
 * Main entry point for all Aster Finance related functionality
 */

// Data Service
export { default as asterDataService } from './dataService';

// Re-export individual functions for convenience
export {
  openInterest,
  quoteVolume,
  volume,
  fundingRate,
  fundingRateHistory,
  markPrice,
  indexPrice,
  price,
  priceChangePercent,
  tradeCount,
  marketData,
  batchData,
  orderBook,
  spread,
  bidPrice,
  askPrice
} from './dataService';

// Protocol metadata
export const ASTER_CONFIG = {
  name: 'Aster Finance',
  id: 'aster',
  baseUrl: '/api/aster',
  color: 'blue',
  endpoints: {
    exchangeInfo: 'exchangeInfo',
    ticker: 'ticker/24hr',
    openInterest: 'openInterest',
    premiumIndex: 'premiumIndex',
    depth: 'depth'
  },
  features: {
    hasSpread: true,
    hasFunding: true,
    hasOpenInterest: true,
    hasOrderBook: true
  }
};
