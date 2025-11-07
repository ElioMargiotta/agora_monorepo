/**
 * Aster Finance Data Service
 * Provides clean, simple functions to fetch specific market data
 */

class AsterDataService {
  constructor() {
    this.baseUrl = '/api/aster';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Generic cache-enabled fetch function
   */
  async _fetchWithCache(endpoint, params = {}, cacheKey = null) {
    const key = cacheKey || `${endpoint}_${JSON.stringify(params)}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      });
      
      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      
      if (!response.ok) {
        // Handle specific Aster API errors gracefully
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            if (errorData.code === -1121) {
              // Invalid symbol - return null for graceful handling
              console.warn(`Invalid symbol for ${endpoint}:`, params.symbol);
              return null;
            }
            if (errorData.code === -4108) {
              // Symbol is closed/delivering - return null for graceful handling
              console.warn(`Symbol not trading for ${endpoint}:`, params.symbol);
              return null;
            }
            if (errorData.code === -1000) {
              // Unknown error (usually means symbol doesn't support this endpoint)
              console.warn(`Symbol doesn't support ${endpoint}:`, params.symbol);
              return null;
            }
          } catch (e) {
            // If we can't parse the error response, fall through to original error
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
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all available trading symbols
   * @returns {Promise<Array>} Array of symbols with TRADING status
   */
  async getAllMarkets() {
    // Get exchange info to see all TRADING symbols
    console.log('📊 Fetching all TRADING symbols from exchange info...');
    const exchangeInfo = await this._fetchWithCache('exchangeInfo', {}, 'exchange_info');
    
    if (!exchangeInfo || !exchangeInfo.symbols) {
      throw new Error('Failed to fetch exchange info from Aster Finance');
    }
    
    // Get only TRADING symbols (actively trading, not closed/settling)
    const tradingSymbols = exchangeInfo.symbols
      .filter(symbolInfo => symbolInfo.status === 'TRADING')
      .map(symbolInfo => symbolInfo.symbol)
      .sort();
    
    console.log(`✅ Found ${tradingSymbols.length} TRADING symbols`);
    
    // Get ticker data to sort by volume
    const tickerData = await this._fetchWithCache('ticker/24hr', {}, 'all_ticker');
    if (!tickerData || !Array.isArray(tickerData)) {
      // Return all trading symbols alphabetically if no ticker data
      return tradingSymbols;
    }
    
    // Filter ticker data to only include TRADING symbols and sort by volume
    const validTickers = tickerData
      .filter(ticker => tradingSymbols.includes(ticker.symbol))
      .filter(ticker => parseFloat(ticker.volume || 0) > 0)
      .sort((a, b) => parseFloat(b.volume || 0) - parseFloat(a.volume || 0))
      .map(ticker => ticker.symbol);
    
    console.log(`🔝 ${validTickers.length} trading symbols sorted by volume`);
    return validTickers;
  }

  /**
   * Get open interest for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Open interest value
   */
  async openInterest(symbol) {
    try {
      // Ensure symbol has USDT suffix if not provided
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('openInterest', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.openInterest || 0);
    } catch (error) {
      console.error(`Error fetching open interest for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get 24h quote volume for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Quote volume value
   */
  async quoteVolume(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.quoteVolume || 0);
    } catch (error) {
      console.error(`Error fetching quote volume for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get 24h base volume for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Base volume value
   */
  async volume(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.volume || 0);
    } catch (error) {
      console.error(`Error fetching volume for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get 24h quote volume for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Quote volume value
   */
  async quoteVolume(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.quoteVolume || 0);
    } catch (error) {
      console.error(`Error fetching quote volume for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get funding rate for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Funding rate value
   */
  async fundingRate(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('premiumIndex', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.lastFundingRate || 0);
    } catch (error) {
      console.error(`Error fetching funding rate for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get all funding rates (attempt bulk fetch)
   * @returns {Promise<Object>} Object with symbol as key and funding rate as value
   */
  async getAllFundingRates() {
    try {
      // Get all premium index data in one call (no symbol parameter)
      const data = await this._fetchWithCache('premiumIndex', {}, 'all_premium_index');
      console.log('Bulk funding data:', data);
      if (!data || !Array.isArray(data)) return {};
      
      // Transform to symbol -> rate mapping
      const rates = {};
      data.forEach(item => {
        if (item.symbol && item.lastFundingRate !== undefined) {
          const symbol = item.symbol.replace('USDT', '');
          rates[symbol] = parseFloat(item.lastFundingRate || 0);
        }
      });
      return rates;
    } catch (error) {
      console.error('Error fetching all funding rates:', error);
      return {};
    }
  }

  /**
   * Get historical funding rates for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @param {number} startTime - Start time in milliseconds (optional)
   * @param {number} endTime - End time in milliseconds (optional)
   * @param {number} limit - Number of records to return (default 100, max 1000)
   * @returns {Promise<Array>} Array of funding rate history objects
   */
  async fundingRateHistory(symbol, startTime = null, endTime = null, limit = 100) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const params = { symbol: formattedSymbol, limit };
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      
      const data = await this._fetchWithCache('fundingRate', params);
      if (!data || !Array.isArray(data)) return [];
      
      // Transform the data to include parsed values
      return data.map(item => ({
        symbol: item.symbol,
        fundingRate: parseFloat(item.fundingRate || 0),
        fundingTime: parseInt(item.fundingTime || 0),
        timestamp: new Date(parseInt(item.fundingTime || 0))
      }));
    } catch (error) {
      console.error(`Error fetching funding rate history for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get mark price for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Mark price value
   */
  async markPrice(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('premiumIndex', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.markPrice || 0);
    } catch (error) {
      console.error(`Error fetching mark price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get index price for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Index price value
   */
  async indexPrice(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('premiumIndex', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.indexPrice || 0);
    } catch (error) {
      console.error(`Error fetching index price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get current price for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Current price value
   */
  async price(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.lastPrice || 0);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get 24h price change percentage for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Price change percentage
   */
  async priceChangePercent(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseFloat(data.priceChangePercent || 0);
    } catch (error) {
      console.error(`Error fetching price change for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get 24h trade count for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Trade count
   */
  async tradeCount(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const data = await this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol });
      if (!data) return 0; // Handle null response from invalid/closed symbols
      return parseInt(data.count || 0);
    } catch (error) {
      console.error(`Error fetching trade count for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get order book depth for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @param {number} limit - Number of bids/asks to return (min: 5, default: 20)
   * @returns {Promise<Object>} Order book with bids and asks
   */
  async orderBook(symbol, limit = 20) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      // Ensure minimum limit of 5
      const validLimit = Math.max(5, limit);
      
      const data = await this._fetchWithCache('depth', { 
        symbol: formattedSymbol, 
        limit: validLimit 
      });
      if (!data) return { bids: [], asks: [] };
      
      return {
        symbol: formattedSymbol,
        bids: data.bids || [],
        asks: data.asks || [],
        lastUpdateId: data.lastUpdateId,
        timestamp: data.E || Date.now()
      };
    } catch (error) {
      console.error(`Error fetching order book for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  }

  /**
   * Get bid-ask spread for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<Object>} Spread data including absolute and percentage spread
   */
  async spread(symbol) {
    try {
      const orderBook = await this.orderBook(symbol, 5);
      
      if (!orderBook.bids.length || !orderBook.asks.length) {
        return {
          symbol: orderBook.symbol || symbol,
          bidPrice: 0,
          askPrice: 0,
          spread: 0,
          spreadPercent: 0,
          midPrice: 0,
          timestamp: Date.now()
        };
      }
      
      const bidPrice = parseFloat(orderBook.bids[0][0]);
      const askPrice = parseFloat(orderBook.asks[0][0]);
      const spread = askPrice - bidPrice;
      const midPrice = (bidPrice + askPrice) / 2;
      const spreadPercent = askPrice > 0 ? (spread / askPrice) * 100 : 0;
      
      return {
        symbol: orderBook.symbol,
        bidPrice,
        askPrice,
        spread,
        spreadPercent,
        midPrice,
        timestamp: orderBook.timestamp
      };
    } catch (error) {
      console.error(`Error fetching spread for ${symbol}:`, error);
      return {
        symbol: symbol,
        bidPrice: 0,
        askPrice: 0,
        spread: 0,
        spreadPercent: 0,
        midPrice: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get best bid price for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Best bid price
   */
  async bidPrice(symbol) {
    try {
      const orderBook = await this.orderBook(symbol, 5);
      if (!orderBook.bids.length) return 0;
      return parseFloat(orderBook.bids[0][0]);
    } catch (error) {
      console.error(`Error fetching bid price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get best ask price for a specific symbol
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<number>} Best ask price
   */
  async askPrice(symbol) {
    try {
      const orderBook = await this.orderBook(symbol, 5);
      if (!orderBook.asks.length) return 0;
      return parseFloat(orderBook.asks[0][0]);
    } catch (error) {
      console.error(`Error fetching ask price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get all market data for a specific symbol in one call
   * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT', 'BTC')
   * @returns {Promise<Object>} Complete market data object
   */
  async marketData(symbol) {
    try {
      const formattedSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
      
      const [tickerData, premiumData, openInterestData] = await Promise.all([
        this._fetchWithCache('ticker/24hr', { symbol: formattedSymbol }),
        this._fetchWithCache('premiumIndex', { symbol: formattedSymbol }),
        this._fetchWithCache('openInterest', { symbol: formattedSymbol })
      ]);

      return {
        symbol: formattedSymbol,
        price: parseFloat(tickerData?.lastPrice || 0),
        priceChange: parseFloat(tickerData?.priceChange || 0),
        priceChangePercent: parseFloat(tickerData?.priceChangePercent || 0),
        volume: parseFloat(tickerData?.volume || 0),
        quoteVolume: parseFloat(tickerData?.quoteVolume || 0),
        tradeCount: parseInt(tickerData?.count || 0),
        openInterest: parseFloat(openInterestData?.openInterest || 0),
        markPrice: parseFloat(premiumData?.markPrice || 0),
        indexPrice: parseFloat(premiumData?.indexPrice || 0),
        fundingRate: parseFloat(premiumData?.lastFundingRate || 0),
        nextFundingTime: premiumData?.nextFundingTime,
        high24h: parseFloat(tickerData?.highPrice || 0),
        low24h: parseFloat(tickerData?.lowPrice || 0),
        openPrice: parseFloat(tickerData?.openPrice || 0),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple symbols data in batch
   * @param {string[]} symbols - Array of trading symbols
   * @param {string} dataType - Type of data to fetch ('openInterest', 'volume', 'price', etc.)
   * @returns {Promise<Object>} Object with symbol as key and value as result
   */
  async batchData(symbols, dataType = 'marketData') {
    try {
      const results = {};
      const promises = symbols.map(async (symbol) => {
        const value = await this[dataType](symbol);
        results[symbol] = value;
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error(`Error fetching batch data:`, error);
      return {};
    }
  }

  /**
   * Get all market data (attempt bulk fetch)
   * @returns {Promise<Object>} Object with symbol as key and market data as value
   */
  async getAllMarketData() {
    try {
      // Try to get all ticker data in one call
      const tickerData = await this._fetchWithCache('ticker/24hr', {}, 'all_ticker');
      if (!tickerData || !Array.isArray(tickerData)) return {};
      
      // For premium index and open interest, we'd need bulk endpoints
      // For now, return basic ticker data
      const marketData = {};
      tickerData.forEach(ticker => {
        if (ticker.symbol) {
          const symbol = ticker.symbol.replace('USDT', '');
          marketData[symbol] = {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice || 0),
            volume: parseFloat(ticker.volume || 0),
            quoteVolume: parseFloat(ticker.quoteVolume || 0),
            // Note: fundingRate, openInterest, markPrice would need separate bulk calls
          };
        }
      });
      return marketData;
    } catch (error) {
      console.error('Error fetching all market data:', error);
      return {};
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache status
   */
  getCacheInfo() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create and export a singleton instance
const asterDataService = new AsterDataService();
export default asterDataService;

// Also export individual functions for direct import
export const {
  openInterest,
  quoteVolume,
  volume,
  fundingRate,
  fundingRateHistory,
  getAllFundingRates,
  markPrice,
  indexPrice,
  price,
  priceChangePercent,
  tradeCount,
  marketData,
  getAllMarketData,
  batchData,
  orderBook,
  spread,
  bidPrice,
  askPrice
} = asterDataService;
