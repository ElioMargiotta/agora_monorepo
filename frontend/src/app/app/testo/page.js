'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

// Hyperliquid components
import {
  LiveMarketMetrics as HyperliquidLiveMarketMetrics,
  SymbolsProvider as HyperliquidSymbolsProvider,
  useSymbols as useHyperliquidSymbols
} from '../../../components/protocols/hyperliquid';

// Aster components
import {
  LiveMarketMetrics as AsterLiveMarketMetrics,
  SymbolsProvider as AsterSymbolsProvider
} from '../../../components/protocols/aster';

import { useHyperliquidFunding } from '../../../hooks/protocols/hyperliquid';
import { useExtendedFunding, useExtendedMarketNames } from '../../../lib/protocols/extended/rest';
import { useAsterFunding } from '../../../hooks/protocols/aster/useAsterFunding';

function HyperliquidSection() {
  const { symbols, isUsingRealData, symbolsLoading, symbolsError } = useHyperliquidSymbols();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Hyperliquid API Test
            <Badge variant={isUsingRealData ? "default" : "secondary"}>
              {isUsingRealData ? "● Live Data" : "○ Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><strong>Symbols:</strong> {symbols?.length || 0}</div>
              <div><strong>Loading:</strong> {symbolsLoading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {symbolsError ? 'Yes' : 'No'}</div>
              <div><strong>Real Data:</strong> {isUsingRealData ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <HyperliquidLiveMarketMetrics symbols={symbols} isUsingRealData={isUsingRealData} />
    </div>
  );
}

function AsterSection() {
  return (
    <AsterSymbolsProvider>
      {({ symbols, isUsingRealData, symbolsLoading, symbolsError }) => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Aster API Test
                <Badge variant={isUsingRealData ? "default" : "secondary"}>
                  {isUsingRealData ? "● Live Data" : "○ Offline"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><strong>Symbols:</strong> {symbols?.length || 0}</div>
                  <div><strong>Loading:</strong> {symbolsLoading ? 'Yes' : 'No'}</div>
                  <div><strong>Error:</strong> {symbolsError ? 'Yes' : 'No'}</div>
                  <div><strong>Real Data:</strong> {isUsingRealData ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AsterLiveMarketMetrics symbols={symbols} isUsingRealData={isUsingRealData} />
        </div>
      )}
    </AsterSymbolsProvider>
  );
}

function ExtendedSection() {
  const { marketNames, loading, error, refetch } = useExtendedMarketNames();
  const [activeTab, setActiveTab] = useState('markets');
  const [selectedMarket, setSelectedMarket] = useState('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Extended API Test
            <Badge variant="default">● Live Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><strong>Markets:</strong> {marketNames.length}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error ? 'Yes' : 'No'}</div>
              <div><strong>Active Tab:</strong> {activeTab}</div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === 'markets' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('markets')}
              >
                Markets ({marketNames.length})
              </Button>
              <Button
                variant={activeTab === 'websocket' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('websocket')}
              >
                WebSocket
              </Button>
              <Button
                variant={activeTab === 'funding' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('funding')}
              >
                Funding History
              </Button>
              <Button
                variant={activeTab === 'funding-rates' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('funding-rates')}
              >
                Live Funding
              </Button>
              <Button
                variant={activeTab === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('chart')}
              >
                Chart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'markets' && (
        <Card>
          <CardHeader>
            <CardTitle>Market Names</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading markets...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error.message}</p>
                <Button onClick={refetch} className="mt-2" size="sm">Retry</Button>
              </div>
            )}

            {marketNames.length > 0 && !loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {marketNames.slice(0, 24).map((market, index) => (
                  <div
                    key={market}
                    className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm font-mono text-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setSelectedMarket(market);
                      setActiveTab('chart');
                    }}
                  >
                    {market}
                  </div>
                ))}
                {marketNames.length > 24 && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm text-center col-span-full">
                    ... and {marketNames.length - 24} more markets
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'websocket' && <div className="p-4 text-gray-500">WebSocket Dashboard - Coming Soon</div>}
      {activeTab === 'funding' && <div className="p-4 text-gray-500">Funding History Dashboard - Coming Soon</div>}
      {activeTab === 'funding-rates' && <div className="p-4 text-gray-500">Live Funding Rates Dashboard - Coming Soon</div>}
      {activeTab === 'chart' && (
        <div className="p-4 text-gray-500">Historical Funding Rate Chart - Coming Soon</div>
      )}
    </div>
  );
}

function ComparisonSection() {
  const hyperliquidFunding = useHyperliquidFunding();
  const extendedFunding = useExtendedFunding();
  const asterFunding = useAsterFunding();
  const [timePeriod, setTimePeriod] = useState('1h');

  // Create a map of assets to their funding rates across platforms
  const assetMap = React.useMemo(() => {
    const map = new Map();

    // Helper to add data to map
    const addToMap = (data, platform) => {
      data.forEach(item => {
        const asset = (item.coin || item.asset || '').toUpperCase().replace('USDT', '').replace('USD', '');
        if (!map.has(asset)) {
          map.set(asset, {});
        }
        map.get(asset)[platform] = item.fundingRate;
      });
    };

    if (hyperliquidFunding.data) addToMap(hyperliquidFunding.data, 'hyperliquid');
    if (extendedFunding.data) addToMap(extendedFunding.data, 'extended');
    if (asterFunding.data) addToMap(asterFunding.data, 'aster');

    // Filter to only assets present in at least 2 platforms
    const filteredMap = new Map();
    for (const [asset, rates] of map) {
      const platforms = Object.keys(rates);
      if (platforms.length >= 2) {
        filteredMap.set(asset, rates);
      }
    }

    return filteredMap;
  }, [hyperliquidFunding.data, extendedFunding.data, asterFunding.data]);

  const getMultiplier = () => {
    switch (timePeriod) {
      case '1h': return 1;
      case '1D': return 24;
      case 'annual': return 24 * 365;
      default: return 1;
    }
  };

  const formatRate = (rate) => {
    if (rate === undefined) return '-';
    const multipliedRate = rate * getMultiplier();
    const percentage = (multipliedRate * 100).toFixed(4);
    return `${percentage}%`;
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case '1h': return '1 Hour';
      case '1D': return '1 Day';
      case 'annual': return 'Annual';
      default: return '1 Hour';
    }
  };

  const isLoading = hyperliquidFunding.loading || extendedFunding.loading || asterFunding.loading;
  const hasError = hyperliquidFunding.error || extendedFunding.error || asterFunding.error;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            Funding Rates Comparison
            <Badge variant="outline">{assetMap.size} shared assets</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Time Period Selector */}
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              <Button
                variant={timePeriod === '1h' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimePeriod('1h')}
                className="px-4"
              >
                1 Hour
              </Button>
              <Button
                variant={timePeriod === '1D' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimePeriod('1D')}
                className="px-4"
              >
                1 Day
              </Button>
              <Button
                variant={timePeriod === 'annual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimePeriod('annual')}
                className="px-4"
              >
                Annual
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Showing funding rates for: <span className="font-medium">{getPeriodLabel()}</span>
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              <span className="ml-3">Loading funding data...</span>
            </div>
          )}

          {hasError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">Some platforms have errors:</p>
              <ul className="text-sm text-red-700 mt-2">
                {hyperliquidFunding.error && <li>• Hyperliquid: {hyperliquidFunding.error}</li>}
                {extendedFunding.error && <li>• Extended: {extendedFunding.error}</li>}
                {asterFunding.error && <li>• Aster: {asterFunding.error}</li>}
              </ul>
            </div>
          )}

          {!isLoading && assetMap.size > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Asset</th>
                    <th className="text-right py-2 px-4 font-semibold text-blue-600">Hyperliquid</th>
                    <th className="text-right py-2 px-4 font-semibold text-green-600">Extended</th>
                    <th className="text-right py-2 px-4 font-semibold text-purple-600">Aster</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(assetMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([asset, rates]) => (
                      <tr key={asset} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium">{asset}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-mono ${rates.hyperliquid >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatRate(rates.hyperliquid)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-mono ${rates.extended >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatRate(rates.extended)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-mono ${rates.aster >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatRate(rates.aster)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && assetMap.size === 0 && !hasError && (
            <div className="text-center py-8 text-muted-foreground">
              No shared assets found across platforms
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestPage() {
  const [activeSection, setActiveSection] = useState('hyperliquid');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />

      {/* Animated background shapes */}
      <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-3">
                API Comparison Test
              </h1>
              <p className="text-muted-foreground text-lg">
                Compare <span className="text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">Hyperliquid</span>,
                <span className="text-primary bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent font-semibold ml-1">Extended</span>, and
                <span className="text-primary bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent font-semibold ml-1">Aster</span> API implementations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              <Button
                variant={activeSection === 'hyperliquid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('hyperliquid')}
                className="min-w-[140px] px-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Hyperliquid
                </div>
              </Button>
              <Button
                variant={activeSection === 'extended' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('extended')}
                className="min-w-[140px] px-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Extended
                </div>
              </Button>
              <Button
                variant={activeSection === 'aster' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('aster')}
                className="min-w-[140px] px-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Aster
                </div>
              </Button>
              <Button
                variant={activeSection === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('comparison')}
                className="min-w-[140px] px-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  Comparison
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Section Content */}
        <div className="space-y-6">
          {activeSection === 'hyperliquid' && (
            <HyperliquidSymbolsProvider>
              <HyperliquidSection />
            </HyperliquidSymbolsProvider>
          )}
          {activeSection === 'extended' && <ExtendedSection />}
          {activeSection === 'aster' && <AsterSection />}
          {activeSection === 'comparison' && <ComparisonSection />}
        </div>

        {/* Comparison Summary */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>API Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">Hyperliquid</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• JSON POST API</li>
                  <li>• Real-time funding rates</li>
                  <li>• Market data with OI/Volume</li>
                  <li>• 8-hour funding intervals</li>
                  <li>• No rate limits specified</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600 dark:text-green-400">Extended</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• REST API with WebSocket</li>
                  <li>• Real-time funding rates</li>
                  <li>• Market data with OI/Volume</li>
                  <li>• 8-hour funding intervals</li>
                  <li>• Starknet integration</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-600 dark:text-purple-400">Aster</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• REST API</li>
                  <li>• Real-time funding rates</li>
                  <li>• Market data with OI/Volume</li>
                  <li>• 4-hour funding intervals</li>
                  <li>• 2400 requests/minute limit</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}