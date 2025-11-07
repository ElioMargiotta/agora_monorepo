/**
 * Extended WebSocket Configuration
 */
export const EXTENDED_WS_CONFIG = {
  MAINNET_BASE: 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1',
  TESTNET_BASE: 'wss://starknet.sepolia.extended.exchange/stream.extended.exchange/v1',
  RECONNECT_DELAY: 2000,
  MESSAGE_HISTORY_LIMIT: 5,
  PING_INTERVAL: 30000
};

/**
 * Extended WebSocket Endpoints
 */
export const EXTENDED_WS_ENDPOINTS = {
  ORDERBOOK: '/orderbooks',
  TRADES: '/publicTrades',
  FUNDING: '/funding',
  MARK_PRICE: '/prices/mark',
  INDEX_PRICE: '/prices/index'
};

/**
 * Extended Market Data Types
 */
export const EXTENDED_DATA_TYPES = {
  ORDERBOOK_FULL: 'orderbook_full',
  ORDERBOOK_BEST: 'orderbook_best',
  TRADES: 'trades',
  FUNDING: 'funding',
  MARK_PRICE: 'mark_price',
  INDEX_PRICE: 'index_price'
};

/**
 * Extended WebSocket Message Types
 */
export const EXTENDED_MESSAGE_TYPES = {
  SNAPSHOT: 'SNAPSHOT',
  DELTA: 'DELTA',
  TRADE: 'TRADE',
  FUNDING: 'FUNDING'
};

/**
 * Extended Market Status
 */
export const EXTENDED_MARKET_STATUS = {
  ACTIVE: 'ACTIVE',
  REDUCE_ONLY: 'REDUCE_ONLY',
  DELISTED: 'DELISTED',
  PRELISTED: 'PRELISTED',
  DISABLED: 'DISABLED'
};

/**
 * Common Extended markets
 */
export const EXTENDED_MARKETS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'AVAX-USD',
  'DOGE-USD',
  'ADA-USD',
  'MATIC-USD',
  'DOT-USD',
  'LINK-USD',
  'UNI-USD',
  'NEAR-USD',
  'ATOM-USD',
  'FTM-USD',
  'MANA-USD',
  'SAND-USD',
  'APE-USD',
  'LTC-USD',
  'BCH-USD',
  'XRP-USD',
  'TRX-USD'
];

/**
 * Extended API Response Types
 */
export const EXTENDED_RESPONSE_SCHEMA = {
  ORDERBOOK: {
    ts: 'number',
    type: 'string', // SNAPSHOT | DELTA
    data: {
      m: 'string', // market name
      b: 'array', // bids [{p: string, q: string}]
      a: 'array'  // asks [{p: string, q: string}]
    },
    seq: 'number'
  }
};
