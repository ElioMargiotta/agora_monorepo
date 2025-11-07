/**
 * Hyperliquid Data Service
 * Provides clean, simple functions to fetch specific market data
 */

class HyperliquidDataService {
  constructor() {
    this.baseUrl = '/api/hyperliquid';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Generic cache-enabled fetch function
   */
  async _fetchWithCache(type, params = {}, cacheKey = null) {
    const key = cacheKey || `${type}_${JSON.stringify(params)}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const queryParams = new URLSearchParams({
        type,
        ...params
      });

      const response = await fetch(`${this.baseUrl}?${queryParams}`);

      if (!response.ok) {
        // Handle specific Hyperliquid API errors gracefully
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            console.warn(`Hyperliquid API error for ${type}:`, errorData);
            return null;
          } catch (parseError) {
            console.warn(`Failed to parse error response for ${type}`);
            return null;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get all trading pairs with market data
   */
  async getAllMids() {
    return this._fetchWithCache('allMids');
  }

  /**
   * Get meta information about available assets
   */
  async getMeta() {
    return this._fetchWithCache('meta');
  }

  /**
   * Get meta and asset contexts (includes funding rates)
   */
  async getMetaAndAssetCtxs() {
    return this._fetchWithCache('metaAndAssetCtxs');
  }

  /**
   * Get orderbook for a specific asset
   */
  async getOrderbook(coin, nSigFigs = 3) {
    if (!coin) throw new Error('Coin parameter is required');
    return this._fetchWithCache('l2Book', { coin, nSigFigs });
  }

  /**
   * Get recent trades for a specific asset
   */
  async getRecentTrades(coin) {
    if (!coin) throw new Error('Coin parameter is required');
    return this._fetchWithCache('recentTrades', { coin });
  }

  /**
   * Get historical funding rates for a specific asset
   */
  async getFundingHistory(coin, startTime, endTime) {
    if (!coin) throw new Error('Coin parameter is required');
    if (!startTime || !endTime) throw new Error('startTime and endTime are required');

    return this._fetchWithCache('fundingHistory', {
      coin,
      startTime: Math.floor(startTime),
      endTime: Math.floor(endTime)
    });
  }

  /**
   * Get funding rates for all assets
   */
  async getFundingRates() {
    const data = await this.getMetaAndAssetCtxs();
    if (!data) return [];

    const [meta, assetCtxs] = data;
    const fundingRates = [];

    if (meta && meta.universe && assetCtxs) {
      meta.universe.forEach((asset, index) => {
        const assetCtx = assetCtxs[index];
        if (assetCtx && assetCtx.funding !== undefined) {
          fundingRates.push({
            coin: asset.name,
            fundingRate: assetCtx.funding,
            markPx: assetCtx.markPx,
            openInterest: parseFloat(assetCtx.openInterest) * parseFloat(assetCtx.markPx) || 0,
            volume24h: parseFloat(assetCtx.dayNtlVlm) || 0,
          });
        }
      });
    }

    return fundingRates;
  }

  /**
   * Get 24h statistics for all assets
   */
  async get24hStats() {
    return this.getMetaAndAssetCtxs();
  }

  /**
   * Get market data for a specific symbol
   */
  async getMarketData(symbol) {
    if (!symbol) throw new Error('Symbol parameter is required');

    const [mids, metaAndAssetCtxs] = await Promise.all([
      this.getAllMids(),
      this.getMetaAndAssetCtxs()
    ]);

    if (!mids || !metaAndAssetCtxs) return null;

    const [meta, assetCtxs] = metaAndAssetCtxs;
    const coin = symbol.replace('/USD', ''); // Remove /USD suffix if present

    // Check if the asset exists and is not delisted
    const assetIndex = meta?.universe?.findIndex(asset => asset.name === coin);
    if (assetIndex === -1) return null;

    const asset = meta.universe[assetIndex];
    if (asset.isDelisted) return null; // Don't return data for delisted assets

    const price = parseFloat(mids[coin]) || 0;
    const assetCtx = assetCtxs[assetIndex];

    if (assetIndex === -1 || !assetCtx) return null;

    const openInterest = parseFloat(assetCtx.openInterest) || 0;
    const markPx = parseFloat(assetCtx.markPx) || price;
    const openInterestUSD = openInterest * markPx;

    return {
      symbol: `${coin}/USD`,
      coin: coin,
      price: price,
      markPx: markPx,
      fundingRate: parseFloat(assetCtx.funding) || 0,
      openInterest: openInterest,
      openInterestUSD: openInterestUSD,
      volume24h: parseFloat(assetCtx.dayNtlVlm) || 0,
      prevDayPx: parseFloat(assetCtx.prevDayPx) || price,
      change24h: price > 0 && assetCtx.prevDayPx ?
        ((price - parseFloat(assetCtx.prevDayPx)) / parseFloat(assetCtx.prevDayPx)) * 100 : 0,
      maxLeverage: meta.universe[assetIndex].maxLeverage || 1,
      isActive: !asset.isDelisted,
      onlyIsolated: asset.onlyIsolated || false,
    };
  }

  /**
   * Get comprehensive market data for all available markets
   */
  async getAllMarkets() {
    const [mids, metaAndAssetCtxs] = await Promise.all([
      this.getAllMids(),
      this.getMetaAndAssetCtxs()
    ]);

    if (!mids || !metaAndAssetCtxs) return [];

    const [meta, assetCtxs] = metaAndAssetCtxs;
    const markets = [];

    if (!meta || !meta.universe || !assetCtxs) return [];

    meta.universe.forEach((asset, index) => {
      // Skip delisted assets
      if (asset.isDelisted) return;

      const coin = asset.name;
      const price = parseFloat(mids[coin]) || 0;
      const assetCtx = assetCtxs[index];

      if (price > 0 && assetCtx) {
        // Calculate 24h change from prevDayPx
        const prevDayPx = parseFloat(assetCtx.prevDayPx) || price;
        const change24h = prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : 0;

        const openInterest = parseFloat(assetCtx.openInterest) || 0;
        const markPx = parseFloat(assetCtx.markPx) || price;
        const openInterestUSD = openInterest * markPx;

        markets.push({
          base: coin,
          coin: coin,
          quote: 'USD',
          symbol: `${coin}/USD`,
          venue: 'hyperliquid',
          price: price,
          change24h: change24h,
          volume24h: parseFloat(assetCtx.dayNtlVlm) || 0,
          high24h: price * 1.02, // Approximate since not provided directly
          low24h: price * 0.98, // Approximate since not provided directly
          fundingRate: assetCtx.funding ? parseFloat(assetCtx.funding) * 100 : null,
          openInterest: openInterest,
          openInterestUSD: openInterestUSD,
          maxLeverage: asset.maxLeverage || 1,
          markPx: markPx,
          isActive: !asset.isDelisted,
          onlyIsolated: asset.onlyIsolated || false,
        });
      }
    });

    return markets;
  }

  /**
   * Get spread analysis between Hyperliquid and another protocol
   */
  async getSpreadAnalysis(symbol, otherProtocolRate) {
    const marketData = await this.getMarketData(symbol);
    if (!marketData) return null;

    const hlRate = marketData.fundingRate;

    return {
      symbol,
      hyperliquidRate: hlRate,
      otherProtocolRate: otherProtocolRate,
      spread: Math.abs(hlRate - otherProtocolRate),
      direction: hlRate > otherProtocolRate ? 'long-hl-short-other' : 'short-hl-long-other',
      timestamp: Date.now(),
    };
  }

  /**
   * Get only active (non-delisted) markets
   */
  async getActiveMarkets() {
    const allMarkets = await this.getAllMarkets();
    return allMarkets.filter(market => market.isActive);
  }

  /**
   * Get only active (non-delisted) symbols
   */
  async getActiveSymbols() {
    return this.getAvailableSymbols(); // This already filters out delisted assets
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

const hyperliquidDataService = new HyperliquidDataService();

export default hyperliquidDataService;

// Export individual methods for convenience
export const {
  getAllMids,
  getMeta,
  getMetaAndAssetCtxs,
  getOrderbook,
  getRecentTrades,
  getFundingHistory,
  getFundingRates,
  get24hStats,
  getMarketData,
  getSpreadAnalysis,
  getAvailableSymbols,
  getActiveSymbols,
  getAllMarkets,
  getActiveMarkets,
  clearCache,
} = hyperliquidDataService;
