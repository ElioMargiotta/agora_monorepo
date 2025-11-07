'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useHyperliquidMarkets } from '@/hooks/protocols/hyperliquid';
import { useExtendedMarkets } from '@/lib/protocols/extended/rest';

export function ComparisonPairsTable({ searchQuery = '' }) {
  const [sortBy, setSortBy] = useState('volume24hDiff');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch by only rendering after client hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handler to navigate to asset page
  const handleViewAsset = (assetName) => {
    router.push(`/markets/asset/${assetName.toLowerCase()}`);
  };

  // Get data from both exchanges
  const {
    data: hlData,
    loading: hlLoading,
    lastUpdate: hlUpdate,
  } = useHyperliquidMarkets();
  const {
    data: exData,
    loading: exLoading,
    lastUpdate: exUpdate,
  } = useExtendedMarkets();

  // Combine and compare data
  const comparisonData = useMemo(() => {
    if (!hlData || !exData || hlData.length === 0 || exData.length === 0)
      return [];

    const combined = [];

    // Find common pairs between both exchanges
    hlData.forEach((hlPair) => {
      if (!hlPair?.coin) return; // Skip if hlPair.coin is undefined

      const exPair = exData.find(
        (ex) =>
          ex?.base &&
          hlPair?.coin &&
          ex.base.toLowerCase() === hlPair.coin.toLowerCase()
      );

      if (exPair && exPair.price !== undefined && hlPair.markPx !== undefined) {
        const priceDiff =
          (hlPair.markPx || 0) > 0
            ? (((exPair.price || 0) - (hlPair.markPx || 0)) /
                (hlPair.markPx || 1)) *
              100
            : 0;
        const volume24hDiff =
          (hlPair.volume24h || 0) > 0
            ? (((exPair.volume24h || 0) - (hlPair.volume24h || 0)) /
                (hlPair.volume24h || 1)) *
              100
            : 0;
        const fundingDiff =
          exPair.fundingRate !== null &&
          exPair.fundingRate !== undefined &&
          hlPair.funding !== null &&
          hlPair.funding !== undefined
            ? ((exPair.fundingRate || 0) - (hlPair.funding || 0)) * 100 // Convert to basis points for better comparison
            : 0;

        combined.push({
          base: hlPair.coin,
          symbol: `${hlPair.coin}/USD`, // Use full pair name to ensure uniqueness
          // Hyperliquid data
          hl: {
            price: hlPair.markPx || 0,
            volume24h: hlPair.volume24h || 0,
            change24h:
              parseFloat(hlPair.prevDayPx) > 0
                ? (((hlPair.markPx || 0) - parseFloat(hlPair.prevDayPx)) /
                    parseFloat(hlPair.prevDayPx)) *
                  100
                : 0,
            fundingRate: hlPair.funding || 0,
            maxLeverage: hlPair.maxLeverage || 20,
          },
          // Extended data
          ex: {
            price: exPair.price || 0,
            volume24h: exPair.volume24h || 0,
            change24h: exPair.change24h || 0,
            fundingRate: exPair.fundingRate || 0,
            maxLeverage: exPair.maxLeverage || 10,
          },
          // Comparison metrics
          priceDiff,
          volume24hDiff,
          fundingDiff,
          // For sorting
          avgVolume: ((hlPair.volume24h || 0) + (exPair.volume24h || 0)) / 2,
        });
      }
    });

    return combined;
  }, [hlData, exData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!comparisonData) return [];

    let filtered = comparisonData.filter((pair) => {
      const searchLower = searchQuery.toLowerCase();
      const baseLower = pair.base.toLowerCase();
      const displayPair = `${pair.base}/usd`.toLowerCase();

      return (
        baseLower.includes(searchLower) ||
        displayPair.includes(searchLower) ||
        `${pair.base}usd`.toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'symbol':
          aVal = a.base.toLowerCase();
          bVal = b.base.toLowerCase();
          break;
        case 'priceDiff':
          aVal = Math.abs(a.priceDiff || 0);
          bVal = Math.abs(b.priceDiff || 0);
          break;
        case 'volume24hDiff':
          aVal = Math.abs(a.volume24hDiff || 0);
          bVal = Math.abs(b.volume24hDiff || 0);
          break;
        case 'fundingDiff':
          aVal = Math.abs(a.fundingDiff || 0);
          bVal = Math.abs(b.fundingDiff || 0);
          break;
        case 'avgVolume':
          aVal = a.avgVolume;
          bVal = b.avgVolume;
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [comparisonData, searchQuery, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const loading = hlLoading || exLoading;

  // Prevent hydration mismatch - show loading during SSR and initial hydration
  if (!isHydrated || loading) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="bg-muted h-4 w-20 rounded"></div>
                <div className="bg-muted h-4 w-24 rounded"></div>
                <div className="bg-muted h-4 w-16 rounded"></div>
                <div className="bg-muted h-4 w-20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Exchange Comparison</h2>
            <Badge variant="outline" className="px-3 py-1">
              {filteredData.length} common pairs
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium">HL</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-medium">EX</span>
              </div>
            </div>
            {(hlUpdate || exUpdate) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Clock className="h-3 w-3" />
                  <span>Live Data</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th
                  className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('symbol')}
                >
                  Asset
                </th>
                <th className="text-center p-4 font-semibold">Prices</th>
                <th
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('priceDiff')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Price Diff
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">Volume (24h)</th>
                <th
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('fundingDiff')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Funding Rates
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((pair) => {
                const priceDiffAbs = Math.abs(pair.priceDiff || 0);
                const fundingDiffAbs = Math.abs(pair.fundingDiff || 0);

                return (
                  <tr
                    key={pair.symbol}
                    className="hover:bg-muted/30 transition-all duration-200 group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">
                          {pair.base}/USD
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs px-2">
                            {pair.hl.maxLeverage}x HL
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2">
                            {pair.ex.maxLeverage}x EX
                          </Badge>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-sm">
                            $
                            {(pair.hl.price || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-mono text-sm">
                            $
                            {(pair.ex.price || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div
                        className={`font-semibold text-base ${
                          priceDiffAbs > 1
                            ? 'text-red-600'
                            : priceDiffAbs > 0.5
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {pair.priceDiff > 0 ? '+' : ''}
                        {(pair.priceDiff || 0).toFixed(2)}%
                      </div>
                      {priceDiffAbs > 1 && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          High Spread
                        </Badge>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-sm">
                            ${((pair.hl.volume24h || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-mono text-sm">
                            ${((pair.ex.volume24h || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span
                            className={`font-mono text-sm ${
                              pair.hl.fundingRate > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {pair.hl.fundingRate !== null
                              ? `${pair.hl.fundingRate > 0 ? '+' : ''}${(
                                  pair.hl.fundingRate || 0
                                ).toFixed(3)}%`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span
                            className={`font-mono text-sm ${
                              pair.ex.fundingRate > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {pair.ex.fundingRate !== null
                              ? `${pair.ex.fundingRate > 0 ? '+' : ''}${(
                                  (pair.ex.fundingRate || 0) * 100
                                ).toFixed(3)}%`
                              : 'N/A'}
                          </span>
                        </div>
                        {pair.fundingDiff !== null && fundingDiffAbs > 5 && (
                          <Badge
                            variant={
                              fundingDiffAbs > 10 ? 'destructive' : 'secondary'
                            }
                            className="text-xs mt-1"
                          >
                            {(fundingDiffAbs || 0).toFixed(1)}bp diff
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        {/* Asset Details Button */}
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs px-3"
                          onClick={() => handleViewAsset(pair.base)}
                        >
                          View {pair.base}
                        </Button>

                        {/* Exchange Trading Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3"
                            onClick={() =>
                              window.open(
                                `https://app.hyperliquid.xyz/trade/${pair.base}`,
                                '_blank'
                              )
                            }
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                            <ExternalLink className="h-3 w-3 mr-1" />
                            HL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3"
                            onClick={() =>
                              window.open(
                                `https://app.extended.exchange/trade/${pair.base}`,
                                '_blank'
                              )
                            }
                          >
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-1" />
                            <ExternalLink className="h-3 w-3 mr-1" />
                            EX
                          </Button>
                        </div>
                        {(priceDiffAbs > 0.5 || fundingDiffAbs > 5) && (
                          <Badge variant="secondary" className="text-xs">
                            Arbitrage
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="text-sm space-y-2">
            <div className="font-medium">Comparison Legend:</div>
            <div className="grid md:grid-cols-2 gap-2 text-muted-foreground">
              <div>
                • <span className="text-red-600 font-medium">Red Diff</span>:
                Significant price/funding difference
              </div>
              <div>
                •{' '}
                <span className="text-yellow-600 font-medium">Yellow Diff</span>
                : Moderate difference
              </div>
              <div>
                • <span className="text-green-600 font-medium">Green Diff</span>
                : Minimal difference
              </div>
              <div>
                • <strong>bp</strong>: Basis points (1bp = 0.01%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
