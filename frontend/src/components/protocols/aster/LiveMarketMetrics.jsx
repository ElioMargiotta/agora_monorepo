'use client';

import { useState, useEffect } from 'react';
import { useAsterMarkets, useAsterBatchData, useAsterFundingHistory } from '@/hooks/protocols/aster';
import { asterDataService } from '@/lib/protocols/aster';

const LiveMarketMetrics = () => {
  const { markets, loading: marketsLoading } = useAsterMarkets();
  const [selectedSymbols, setSelectedSymbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
  const [metricsData, setMetricsData] = useState({});
  const [fundingIntervals, setFundingIntervals] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

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
            const [marketData, spreadData] = await Promise.all([
              asterDataService.marketData(symbol),
              asterDataService.spread(symbol)
            ]);

            if (marketData && spreadData) {
              // Calculate open interest in USDC
              const openInterestUSDC = marketData.openInterest * marketData.markPrice;
              
              // Use spread data directly from service (already correctly calculated)
              const spreadBps = spreadData.spreadPercent * 100; // Convert percent to basis points

              results[symbol] = {
                symbol,
                fundingRate: marketData.fundingRate,
                quoteVolume: marketData.quoteVolume,
                openInterest: marketData.openInterest,
                openInterestUSDC,
                markPrice: marketData.markPrice,
                spread: {
                  absolute: spreadData.spread,
                  percent: spreadData.spreadPercent,
                  basisPoints: spreadBps,
                  midPrice: spreadData.midPrice,
                  formatted: {
                    absolute: `$${spreadData.spread.toFixed(6)}`,
                    percent: `${spreadData.spreadPercent.toFixed(4)}%`,
                    bps: `${spreadBps.toFixed(1)} bps`
                  }
                },
                bidPrice: spreadData.bidPrice,
                askPrice: spreadData.askPrice,
                nextFundingTime: marketData.nextFundingTime,
                priceChangePercent: marketData.priceChangePercent,
                volume: marketData.volume,
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

  // Fetch funding intervals for selected symbols
  const fetchFundingIntervals = async () => {
    if (!selectedSymbols.length) return;

    try {
      const intervals = {};

      await Promise.all(
        selectedSymbols.map(async (symbol) => {
          try {
            // Get last 10 funding events to calculate interval
            const historyData = await asterDataService.fundingRateHistory(symbol, null, null, 10);
            
            if (historyData && historyData.length >= 2) {
              // Calculate interval from consecutive funding times
              const intervalsMs = [];
              for (let i = 1; i < historyData.length; i++) {
                const interval = historyData[i].fundingTime - historyData[i-1].fundingTime;
                intervalsMs.push(interval);
              }
              
              // Use the most common interval (or average if needed)
              const avgIntervalMs = intervalsMs.reduce((a, b) => a + b, 0) / intervalsMs.length;
              const intervalHours = Math.round(avgIntervalMs / (1000 * 60 * 60));
              
              intervals[symbol] = {
                hours: intervalHours,
                milliseconds: avgIntervalMs,
                sampleSize: intervalsMs.length
              };
            } else {
              // Fallback to estimated interval
              intervals[symbol] = {
                hours: 4, // Default to 4 hours for Aster
                milliseconds: 4 * 60 * 60 * 1000,
                sampleSize: 0,
                estimated: true
              };
            }
          } catch (error) {
            console.error(`Error fetching funding history for ${symbol}:`, error);
            intervals[symbol] = {
              hours: 4, // Default fallback
              milliseconds: 4 * 60 * 60 * 1000,
              sampleSize: 0,
              estimated: true,
              error: error.message
            };
          }
        })
      );

      setFundingIntervals(intervals);
    } catch (error) {
      console.error('Error fetching funding intervals:', error);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([fetchMetrics(), fetchFundingIntervals()]);
    };
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbols]);

  // Format funding rate for display (normalized to hourly rate)
  const formatFundingRate = (rate, symbol) => {
    if (!rate && rate !== 0) return 'N/A';
    
    // For averages or when we don't have interval data, assume 4h interval
    const intervalData = symbol && symbol !== 'average' ? fundingIntervals[symbol] : null;
    const intervalHours = intervalData ? intervalData.hours : 4; // Default to 4 hours
    
    // If this is already an hourly rate (like in averages), don't divide again
    const hourlyRate = symbol === 'average' ? rate : rate / intervalHours;
    
    const percentage = (hourlyRate * 100).toFixed(4);
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

  // Format spread as percentage
  const formatSpreadPercentage = (spread) => {
    if (!spread || spread.percent === undefined) return 'N/A';
    return `${spread.percent.toFixed(4)}%`;
  };

  // Get funding rate color (negative = red, positive = green)
  const getFundingRateColor = (rate) => {
    if (!rate && rate !== 0) return 'text-muted-foreground';
    return rate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  // Get spread quality color
  const getSpreadQualityColor = (spreadBps) => {
    if (spreadBps < 5) return 'text-green-600 dark:text-green-400';
    if (spreadBps < 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Additional floating gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-cyan-200/10 to-blue-300/10 dark:from-cyan-600/10 dark:to-blue-700/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-r from-purple-200/10 to-pink-300/10 dark:from-purple-600/10 dark:to-pink-700/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* Header with Symbol Selection */}
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-lg relative overflow-hidden">
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-cyan-500/8 dark:from-blue-400/8 dark:via-purple-400/5 dark:to-cyan-400/8 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Live Market Metrics
            </h2>
            <p className="text-muted-foreground">
              Real-time <span className="text-blue-600 dark:text-blue-400 font-medium">hourly funding rates</span> with 
              <span className="text-cyan-600 dark:text-cyan-400 font-medium"> calculated intervals</span>, 
              <span className="text-green-600 dark:text-green-400 font-medium"> volume</span>, 
              <span className="text-purple-600 dark:text-purple-400 font-medium"> open interest</span>, and 
              <span className="text-orange-600 dark:text-orange-400 font-medium"> spreads</span>
            </p>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Symbols:
              </label>
              <select
                multiple
                value={selectedSymbols}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedSymbols(values.slice(0, 15)); // Allow up to 15 symbols
                }}
                className="px-3 py-2 border border-input bg-background/50 backdrop-blur-sm text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm min-w-[200px] shadow-sm"
                size={6}
              >
                {markets.map(symbol => (
                  <option key={symbol} value={symbol} className="py-1">{symbol}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple (max 15)</p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {lastUpdate && (
                <div className="bg-background/30 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="font-medium">Live Data</span>
                  </div>
                  <div className="text-xs mt-1">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                  <div className="text-xs">
                    Auto-refresh: 10s
                  </div>
                </div>
              )}
            </div>
          </div>
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
                    Hourly Funding Rate & Interval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    24h Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Open Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Spread
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Mark Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background/50 backdrop-blur-sm divide-y divide-border">{/* Rest of table body */}
                {Object.values(metricsData).map((data) => {
                  if (data.error) {
                    return (
                      <tr key={data.symbol} className="hover:bg-gradient-to-r hover:from-red-50/50 hover:via-transparent hover:to-orange-50/50 dark:hover:from-red-950/30 dark:hover:via-transparent dark:hover:to-orange-950/30 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">{data.symbol}</div>
                        </td>
                        <td colSpan={5} className="px-6 py-4 text-sm text-destructive">
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
                        <div className="text-sm text-muted-foreground">
                          {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent?.toFixed(2)}%
                        </div>
                      </td>

                      {/* Funding Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getFundingRateColor(data.fundingRate)}`}>
                          {formatFundingRate(data.fundingRate, data.symbol)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {fundingIntervals[data.symbol] ? (
                            <span>
                              {fundingIntervals[data.symbol].hours}h interval
                              {fundingIntervals[data.symbol].estimated && (
                                <span className="text-orange-500 ml-1">(est.)</span>
                              )}
                            </span>
                          ) : (
                            'Loading interval...'
                          )}
                        </div>
                      </td>

                      {/* 24h Volume */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {formatVolume(data.quoteVolume)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Base: {data.volume?.toLocaleString()} {data.symbol.replace('USDT', '')}
                        </div>
                      </td>

                      {/* Open Interest */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {formatVolume(data.openInterestUSDC)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.openInterest?.toLocaleString()} contracts
                        </div>
                      </td>

                      {/* Spread */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getSpreadQualityColor(data.spread?.basisPoints)}`}>
                          {formatSpreadPercentage(data.spread) || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.spread?.formatted.bps || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bid: ${data.bidPrice?.toLocaleString()} | Ask: ${data.askPrice?.toLocaleString()}
                        </div>
                      </td>

                      {/* Mark Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          ${data.markPrice?.toLocaleString()}
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

      {/* Summary Cards */}
      {!loading && Object.keys(metricsData).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Average Funding Rate */}
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Hourly Funding Rate</h3>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const rates = Object.values(metricsData)
                  .filter(d => !d.error && d.fundingRate !== null)
                  .map(d => {
                    const intervalData = fundingIntervals[d.symbol];
                    const intervalHours = intervalData ? intervalData.hours : 4;
                    return d.fundingRate / intervalHours; // Convert to hourly rate
                  });
                const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
                return formatFundingRate(avg, 'average'); // Use a dummy symbol since we're averaging
              })()}
            </div>
          </div>

          {/* Total Volume */}
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total 24h Volume</h3>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const totalVolume = Object.values(metricsData)
                  .filter(d => !d.error)
                  .reduce((sum, d) => sum + (d.quoteVolume || 0), 0);
                return formatVolume(totalVolume);
              })()}
            </div>
          </div>

          {/* Total Open Interest */}
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Open Interest</h3>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const totalOI = Object.values(metricsData)
                  .filter(d => !d.error)
                  .reduce((sum, d) => sum + (d.openInterestUSDC || 0), 0);
                return formatVolume(totalOI);
              })()}
            </div>
          </div>

          {/* Average Spread */}
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Spread</h3>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const spreads = Object.values(metricsData)
                  .filter(d => !d.error && d.spread?.basisPoints)
                  .map(d => d.spread.basisPoints);
                const avg = spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
                return `${avg.toFixed(1)} bps`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && Object.keys(metricsData).length === 0 && (
        <div className="bg-background border border-border rounded-lg p-12 text-center shadow-sm">
          <div className="text-muted-foreground mb-4">📊</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Select symbols above to view live market metrics</p>
        </div>
      )}
    </div>
  );
};

export default LiveMarketMetrics;
