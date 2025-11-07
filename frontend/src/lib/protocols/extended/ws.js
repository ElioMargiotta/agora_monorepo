// WebSocket/data service helpers for Extended protocol (moved from src/lib/extendedDataService.js)

export class ExtendedWSService {
  static processMessage(event) {
    try {
      const message = JSON.parse(event.data);
      if (!this.validateMessage(message)) return null;

      switch (message.type) {
        case 'SNAPSHOT':
          return this.processOrderbookSnapshot(message);
        case 'DELTA':
          return this.processOrderbookDelta(message);
        case 'TRADE':
          return this.processTrade(message);
        case 'FUNDING':
          return this.processFunding(message);
        default:
          return null;
      }
    } catch (error) {
      console.error('[ExtendedWSService] Error processing message:', error);
      return null;
    }
  }

  static validateMessage(message) {
    return message && typeof message === 'object' && message.type && message.data && typeof message.data === 'object';
  }

  static processOrderbookSnapshot(message) {
    const { data, ts, seq } = message;
    if (!data?.m) return null;

    const bids = this.processOrderbookLevels(data.b || []);
    const asks = this.processOrderbookLevels(data.a || []);

    const bestBid = bids[0] || null;
    const bestAsk = asks[0] || null;

    return {
      type: 'orderbook',
      market: data.m,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread: this.calculateSpread(bestBid, bestAsk),
      timestamp: ts || Date.now(),
      sequence: seq || 0,
      messageType: 'snapshot'
    };
  }

  static processOrderbookDelta(message) {
    const { data, ts, seq } = message;
    if (!data?.m) return null;

    const bids = this.processOrderbookLevels(data.b || []);
    const asks = this.processOrderbookLevels(data.a || []);

    return {
      type: 'orderbook',
      market: data.m,
      bids,
      asks,
      timestamp: ts || Date.now(),
      sequence: seq || 0,
      messageType: 'delta'
    };
  }

  static processOrderbookLevels(levels) {
    if (!Array.isArray(levels)) return [];
    return levels
      .map(level => {
        if (!level || typeof level !== 'object') return null;
        const price = parseFloat(level.p);
        const quantity = parseFloat(level.q);
        if (isNaN(price) || isNaN(quantity)) return null;
        return { price, quantity, total: price * quantity };
      })
      .filter(Boolean)
      .sort((a, b) => b.price - a.price);
  }

  static calculateSpread(bestBid, bestAsk) {
    if (!bestBid || !bestAsk) return null;
    const absolute = bestAsk.price - bestBid.price;
    const percentage = (absolute / bestAsk.price) * 100; // percentage vs ask
    return { absolute, percentage, midPrice: (bestBid.price + bestAsk.price) / 2 };
  }

  static processTrade(message) {
    const { data, ts } = message;
    return {
      type: 'trade',
      market: data.m,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      side: data.s,
      timestamp: ts || Date.now(),
      messageType: 'trade'
    };
  }

  static processFunding(message) {
    const { data, ts } = message;
    return {
      type: 'funding',
      market: data.m,
      fundingRate: parseFloat(data.fr),
      predictedRate: parseFloat(data.pr),
      timestamp: ts || Date.now(),
      messageType: 'funding'
    };
  }

  static formatForDisplay(marketData) {
    if (!marketData) return null;
    const formatPrice = (price) => {
      if (price >= 1) return price.toFixed(2);
      if (price >= 0.01) return price.toFixed(4);
      return price.toFixed(8);
    };
    const formatQuantity = (q) => q.toFixed(4);

    return {
      ...marketData,
      formatted: {
        bestBidPrice: marketData.bestBid ? formatPrice(marketData.bestBid.price) : 'N/A',
        bestAskPrice: marketData.bestAsk ? formatPrice(marketData.bestAsk.price) : 'N/A',
        bestBidQuantity: marketData.bestBid ? formatQuantity(marketData.bestBid.quantity) : 'N/A',
        bestAskQuantity: marketData.bestAsk ? formatQuantity(marketData.bestAsk.quantity) : 'N/A',
        spread: marketData.spread ? {
          absolute: marketData.spread.absolute.toFixed(6),
          percentage: marketData.spread.percentage.toFixed(4) + '%',
          midPrice: marketData.spread.midPrice.toFixed(6)
        } : null
      }
    };
  }

  static createWebSocketUrl(baseUrl, endpoint, market = null, params = {}) {
    let url = `${baseUrl}${endpoint}`;
    if (market) url += `/${market}`;
    const query = new URLSearchParams(params);
    if (query.toString()) url += `?${query.toString()}`;
    return url;
  }
}

export default ExtendedWSService;
