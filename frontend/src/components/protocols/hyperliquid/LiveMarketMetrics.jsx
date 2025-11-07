'use client';

import { useState, useEffect } from 'react';
import { useHyperliquidMarkets } from '@/hooks/protocols/hyperliquid';
import { hyperliquidDataService } from '@/lib/protocols/hyperliquid';

const LiveMarketMetrics = ({ symbols, isUsingRealData }) => {
  const { data: allMarkets, loading: marketsLoading, error: marketsError, lastUpdate } = useHyperliquidMarkets();
  const [selectedSymbols, setSelectedSymbols] = useState(['BTC/USD', 'ETH/USD', 'SOL/USD']);
  const [metricsData, setMetricsData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch comprehensive data for selected symbols
  const fetchMetrics = async () => {
    if (!selectedSymbols.length) return;

    setLoading(true);
    try {
      const results = {};

      // Fetch all data in parallel for each symbol
      await Promise.all(
        selectedSymbols.map(async (symbol) => {
          try {
            const marketData = await hyperliquidDataService.getMarketData(symbol);

            if (marketData) {
              results[symbol] = {
                symbol,
                fundingRate: marketData.fundingRate,
                volume24h: marketData.volume24h,
                openInterest: marketData.openInterest,
                openInterestUSD: marketData.openInterestUSD,
                markPx: marketData.markPx,
                price: marketData.price,
                change24h: marketData.change24h,
                maxLeverage: marketData.maxLeverage,
                timestamp: Date.now()
              };
            }
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            results[symbol] = { symbol, error: error.message };
          }
        })
      );

      setMetricsData(results);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbols]);

  // Handle symbol selection
  const handleSymbolToggle = (symbol) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (allMarkets) {
      setSelectedSymbols(allMarkets.map(market => market.symbol));
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedSymbols([]);
  };

  // Format funding rate for display
  const formatFundingRate = (rate) => {
    if (!rate && rate !== 0) return 'N/A';
    const percentage = (rate * 100).toFixed(4);
    return `${percentage >= 0 ? '+' : ''}${percentage}%`;
  };

  // Format volume for display
  const formatVolume = (volume) => {
    if (!volume) return '$0';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  // Get funding rate color (negative = red, positive = green)
  const getFundingRateColor = (rate) => {
    if (!rate && rate !== 0) return 'text-muted-foreground';
    return rate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Additional floating gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-cyan-200/10 to-blue-300/10 dark:from-cyan-600/10 dark:to-blue-700/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-r from-purple-200/10 to-pink-300/10 dark:from-purple-600/10 dark:to-pink-700/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-lg relative overflow-hidden">
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-cyan-500/8 dark:from-blue-400/8 dark:via-purple-400/5 dark:to-cyan-400/8 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Live Market Metrics
            </h2>
            <p className="text-muted-foreground">
              Select symbols to monitor and view <span className="text-blue-600 dark:text-blue-400 font-medium">real-time</span> funding rates, volume, and open interest
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {lastUpdate && (
              <div className="bg-background/30 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${
                    isUsingRealData
                      ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-green-500/50'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-yellow-500/50'
                  }`}></div>
                  <span className="font-medium">{isUsingRealData ? 'Live Data' : 'Offline'}</span>
                </div>
                <div className="text-xs mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
                <div className="text-xs">
                  Monitoring: {selectedSymbols.length} symbols
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-lg relative overflow-hidden">
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-cyan-500/8 dark:from-blue-400/8 dark:via-purple-400/5 dark:to-cyan-400/8 pointer-events-none" />

        <div className="relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Select Symbols to Monitor</h3>
              <p className="text-sm text-muted-foreground">
                Choose from {allMarkets?.length || 0} available markets
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-800/30 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Symbol Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
            {allMarkets?.map((market) => (
              <button
                key={market.symbol}
                onClick={() => handleSymbolToggle(market.symbol)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  selectedSymbols.includes(market.symbol)
                    ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                    : 'bg-background text-foreground border-border hover:bg-muted hover:border-border/80'
                }`}
              >
                <div className="font-medium">{market.coin}</div>
                <div className="text-xs opacity-75">/USD</div>
              </button>
            ))}
          </div>

          {marketsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading markets...</span>
            </div>
          )}

          {marketsError && (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">Error loading markets: {marketsError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-background border border-border rounded-lg p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading market metrics...</p>
        </div>
      )}

      {/* Metrics Table */}
      {!loading && Object.keys(metricsData).length > 0 && (
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden shadow-lg relative">
          {/* Table gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/2 to-transparent pointer-events-none" />

          <div className="overflow-x-auto relative z-10">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gradient-to-r from-muted/50 via-muted/60 to-muted/50 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Funding Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    24h Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Open Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Max Leverage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background/50 backdrop-blur-sm divide-y divide-border">
                {Object.values(metricsData).map((data) => {
                  if (data.error) {
                    return (
                      <tr key={data.symbol} className="hover:bg-gradient-to-r hover:from-red-50/50 hover:via-transparent hover:to-orange-50/50 dark:hover:from-red-950/30 dark:hover:via-transparent dark:hover:to-orange-950/30 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">{data.symbol}</div>
                        </td>
                        <td colSpan={6} className="px-6 py-4 text-sm text-destructive">
                          Error: {data.error}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={data.symbol} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-transparent hover:to-purple-50/50 dark:hover:from-blue-950/30 dark:hover:via-transparent dark:hover:to-purple-950/30 transition-all duration-200">
                      {/* Symbol */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{data.symbol}</div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {formatPrice(data.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Mark: {formatPrice(data.markPx)}
                        </div>
                      </td>

                      {/* 24h Change */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${data.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {data.change24h >= 0 ? '+' : ''}{data.change24h?.toFixed(2)}%
                        </div>
                      </td>

                      {/* Funding Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getFundingRateColor(data.fundingRate)}`}>
                          {formatFundingRate(data.fundingRate)}
                        </div>
                      </td>

                      {/* 24h Volume */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {formatVolume(data.volume24h)}
                        </div>
                      </td>

                      {/* Open Interest */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {formatVolume(data.openInterestUSD)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          USD
                        </div>
                      </td>

                      {/* Max Leverage */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {data.maxLeverage || 'N/A'}x
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && Object.keys(metricsData).length === 0 && selectedSymbols.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No data available for selected symbols</p>
        </div>
      )}

      {/* No Selection State */}
      {selectedSymbols.length === 0 && (
        <div className="bg-background border border-border rounded-lg p-12 text-center shadow-sm">
          <p className="text-muted-foreground">Select symbols above to view live market metrics</p>
        </div>
      )}
    </div>
  );
};

export default LiveMarketMetrics;
