/**
 * Extended Markets WebSocket Integration
 * Clean, production-ready WebSocket connection for real-time market data
 *
 * This integrates with your existing:
 * - useExtendedWebSocket hook
 * - ExtendedWSService
 * - Market names API
 */

import React, { useState, useEffect } from 'react';
import { useExtendedMarketNames } from '@/lib/protocols/extended/rest';
import ExtendedWSService from '@/lib/protocols/extended/ws';
import { useExtendedWebSocket } from '@/hooks/protocols/extended/useExtendedWebSocket.js';
import { EXTENDED_DATA_TYPES } from '@/lib/protocols/extended/extendedTypes';

/**
 * Extended Markets WebSocket Manager
 * Provides real-time data for all available markets
 */
export function useExtendedMarketsWebSocket() {
  const { marketNames, loading: marketsLoading } = useExtendedMarketNames();
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [marketConnections, setMarketConnections] = useState(new Map());

  // Auto-select first few markets when available
  useEffect(() => {
    if (marketNames.length > 0 && selectedMarkets.length === 0) {
      // Start with top 5 markets for performance
      const topMarkets = marketNames.slice(0, 5);
      setSelectedMarkets(topMarkets);
    }
  }, [marketNames, selectedMarkets.length]);

  return {
    marketNames,
    marketsLoading,
    selectedMarkets,
    setSelectedMarkets,
    marketConnections
  };
}

/**
 * Extended Market WebSocket Card
 * Individual market with real-time data
 */
export function ExtendedMarketCard({ market, className = '' }) {
  const {
    connectionState,
    isConnected,
    isConnecting,
    marketData,
    bestBid,
    bestAsk,
    spread,
    error,
    reconnect
  } = useExtendedWebSocket(market, EXTENDED_DATA_TYPES.ORDERBOOK_BEST);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'reconnecting': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'reconnecting': return '🟠';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatSpread = (spread) => {
    if (!spread) return 'N/A';

    // Handle both percentage number and spread object
    if (typeof spread === 'object' && spread.percentage !== undefined) {
      return `${parseFloat(spread.percentage).toFixed(4)}%`;
    }

    // Fallback for direct percentage value
    if (typeof spread === 'number' && !isNaN(spread)) {
      return `${parseFloat(spread).toFixed(4)}%`;
    }

    return 'N/A';
  };

  const calculateSpreadFromPrices = (bidPrice, askPrice) => {
    if (!bidPrice || !askPrice || isNaN(bidPrice) || isNaN(askPrice)) {
      return null;
    }

    const bid = parseFloat(bidPrice);
    const ask = parseFloat(askPrice);
    const spreadPercentage = ((ask - bid) / bid) * 100;

    return {
      percentage: spreadPercentage,
      absolute: ask - bid,
      midPrice: (bid + ask) / 2
    };
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{market}</h3>
        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor()}`}>
          {getStatusIcon()} {connectionState}
        </div>
      </div>

      {/* Market Data */}
      {isConnected && marketData ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Best Bid:</span>
              <div className="font-mono font-medium text-green-600">
                ${formatPrice(bestBid?.price)}
              </div>
              {bestBid?.quantity && (
                <div className="text-xs text-gray-400">
                  Qty: {parseFloat(bestBid.quantity).toFixed(4)}
                </div>
              )}
            </div>
            <div>
              <span className="text-gray-500">Best Ask:</span>
              <div className="font-mono font-medium text-red-600">
                ${formatPrice(bestAsk?.price)}
              </div>
              {bestAsk?.quantity && (
                <div className="text-xs text-gray-400">
                  Qty: {parseFloat(bestAsk.quantity).toFixed(4)}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Spread:</span>
                <span className="font-mono font-medium text-blue-600">
                  {formatSpread(spread || calculateSpreadFromPrices(bestBid?.price, bestAsk?.price))}
                </span>
              </div>
              {bestBid?.price && bestAsk?.price && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mid Price:</span>
                  <span className="font-mono text-gray-900">
                    ${formatPrice((parseFloat(bestBid.price) + parseFloat(bestAsk.price)) / 2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          {isConnecting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Connecting...</span>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-sm text-red-600 mb-2">{error}</div>
              <button
                onClick={reconnect}
                className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data</div>
          )}
        </div>
      )}

      {/* Last Update */}
      {marketData?.timestamp && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            Last update: {new Date(marketData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extended Markets WebSocket Dashboard
 * Complete dashboard showing real-time data for selected markets
 */
export default function ExtendedMarketsWebSocketDashboard() {
  const {
    marketNames,
    marketsLoading,
    selectedMarkets,
    setSelectedMarkets
  } = useExtendedMarketsWebSocket();

  const [showMarketSelector, setShowMarketSelector] = useState(false);

  const toggleMarketSelection = (market) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  };

  const selectTopMarkets = (count) => {
    setSelectedMarkets(marketNames.slice(0, count));
    setShowMarketSelector(false);
  };

  if (marketsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading available markets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Extended Markets WebSocket Dashboard
            </h2>
            <p className="text-gray-600">
              Real-time market data for {selectedMarkets.length} selected markets
            </p>
          </div>
          <button
            onClick={() => setShowMarketSelector(!showMarketSelector)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Select Markets ({selectedMarkets.length})
          </button>
        </div>

        {/* Quick Selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectTopMarkets(5)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Top 5
          </button>
          <button
            onClick={() => selectTopMarkets(10)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Top 10
          </button>
          <button
            onClick={() => setSelectedMarkets(marketNames)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            All ({marketNames.length})
          </button>
          <button
            onClick={() => setSelectedMarkets([])}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
          >
            Clear
          </button>
        </div>

        {/* Market Selector */}
        {showMarketSelector && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">
              Available Markets ({marketNames.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {marketNames.map(market => (
                <label key={market} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMarkets.includes(market)}
                    onChange={() => toggleMarketSelection(market)}
                    className="rounded border-gray-300"
                  />
                  <span className="font-mono">{market}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Markets Grid */}
      {selectedMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {selectedMarkets.map(market => (
            <ExtendedMarketCard
              key={market}
              market={market}
              className="hover:shadow-md transition-shadow"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            No markets selected
          </div>
          <p className="text-gray-600 mb-4">
            Select markets to start receiving real-time WebSocket data
          </p>
          <button
            onClick={() => selectTopMarkets(5)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start with Top 5 Markets
          </button>
        </div>
      )}

      {/* WebSocket Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 text-sm">
            <h3 className="font-medium text-blue-800">
              WebSocket Integration Details
            </h3>
            <div className="mt-2 text-blue-700">
              <p>• Each market has its own WebSocket connection for optimal performance</p>
              <p>• Auto-reconnection on connection failures</p>
              <p>• Real-time best bid/ask prices with spreads</p>
              <p>• Using Extended Exchange orderbook depth=1 for efficiency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
