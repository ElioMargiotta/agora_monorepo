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
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';
import {
  calculateDeltaNeutralAPY,
  getFundingDifferentialBPS,
  getDeltaNeutralStrategy,
  debugRates,
} from '@/lib/apyCalculations';

export function ComparisonFundingTable({ searchQuery = '' }) {
  const [sortBy, setSortBy] = useState('fundingDiff');
  const [sortOrder, setSortOrder] = useState('desc');
  const [timePeriod, setTimePeriod] = useState('year'); // 'hours', 'days', 'year'
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

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'hours':
        return '8H';
      case 'days':
        return 'Daily';
      case 'year':
        return 'Annual';
      default:
        return 'Annual';
    }
  };

  // Get data from both exchanges
  const {
    data: hlData,
    loading: hlLoading,
    lastUpdate: hlUpdate,
  } = useHyperliquidFunding();
  const {
    data: exData,
    loading: exLoading,
    lastUpdate: exUpdate,
  } = useExtendedFunding();

  // Combine and compare funding data
  const comparisonData = useMemo(() => {
    if (!hlData || !exData) return [];

    const combined = [];

    // Find common pairs between both exchanges
    hlData.forEach((hlItem) => {
      const exItem = exData.find(
        (ex) => ex.base.toLowerCase() === hlItem.coin.toLowerCase()
      );

      if (exItem) {
        // Debug the rates for the first few items to verify format
        if (combined.length < 3) {
          debugRates(hlItem.coin, hlItem.funding || 0, exItem.fundingRate || 0);
        }

        const fundingDiff = getFundingDifferentialBPS(
          hlItem.funding || 0,
          exItem.fundingRate || 0
        );
        const openInterestDiff =
          (exItem.openInterest || 0) && (hlItem.openInterest || 0)
            ? (((exItem.openInterest || 0) - (hlItem.openInterest || 0)) /
                (hlItem.openInterest || 1)) *
              100
            : null;

        combined.push({
          base: hlItem.coin,
          symbol: hlItem.coin,
          // Hyperliquid data
          hl: {
            fundingRate: hlItem.funding || 0,
            predictedFundingRate:
              hlItem.predictedFunding || hlItem.funding || 0, // Fallback if not available
            dailyFundingRate: (hlItem.funding || 0) * 3 * 365, // 3 times per day * 365 days
            openInterest: hlItem.openInterest || 0,
            price: hlItem.markPrice || hlItem.price || 0,
          },
          // Extended data
          ex: {
            fundingRate: exItem.fundingRate || 0,
            predictedFundingRate: exItem.predictedFundingRate || 0,
            dailyFundingRate: exItem.dailyFundingRate || 0,
            openInterest: exItem.openInterest || 0,
            price: exItem.price || 0,
          },
          // Comparison metrics
          fundingDiff,
          openInterestDiff,
          // Arbitrage opportunity indicator - increased threshold for realistic trading
          isArbitrageOpportunity: Math.abs(fundingDiff) > 25, // More than 25 basis points difference
          // For sorting
          avgOpenInterest:
            ((hlItem.openInterest || 0) + (exItem.openInterest || 0)) / 2,
          // Store original rates for APY calculation
          hlFundingRate: hlItem.funding || 0,
          exFundingRate: exItem.fundingRate || 0,
        });
      }
    });

    return combined;
  }, [hlData, exData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!comparisonData) return [];

    let filtered = comparisonData.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const baseLower = item.base.toLowerCase();
      const displayPair = `${item.base}/usd`.toLowerCase();

      return (
        baseLower.includes(searchLower) ||
        displayPair.includes(searchLower) ||
        `${item.base}usd`.toLowerCase().includes(searchLower)
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
        case 'fundingDiff':
          aVal = Math.abs(a.fundingDiff || 0);
          bVal = Math.abs(b.fundingDiff || 0);
          break;
        case 'openInterestDiff':
          aVal = Math.abs(a.openInterestDiff || 0);
          bVal = Math.abs(b.openInterestDiff || 0);
          break;
        case 'avgOpenInterest':
          aVal = a.avgOpenInterest;
          bVal = b.avgOpenInterest;
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

  // Calculate arbitrage opportunities with different quality levels
  const excellentOpportunities = filteredData.filter(
    (item) => Math.abs(item.fundingDiff) > 50
  ).length;
  const highQualityOpportunities = filteredData.filter(
    (item) => Math.abs(item.fundingDiff) > 25
  ).length;
  const mediumOpportunities = filteredData.filter(
    (item) =>
      Math.abs(item.fundingDiff) > 15 && Math.abs(item.fundingDiff) <= 25
  ).length;
  const arbitrageOpportunities = highQualityOpportunities;

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
                <div className="bg-muted h-4 w-16 rounded"></div>
                <div className="bg-muted h-4 w-24 rounded"></div>
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
        {/* Mobile Time Period Controls */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">APY Period</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimePeriod('hours')}
                className={`text-xs px-3 py-2 rounded transition-colors ${
                  timePeriod === 'hours'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                8H
              </button>
              <button
                onClick={() => setTimePeriod('days')}
                className={`text-xs px-3 py-2 rounded transition-colors ${
                  timePeriod === 'days'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimePeriod('year')}
                className={`text-xs px-3 py-2 rounded transition-colors ${
                  timePeriod === 'year'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Funding Rate Comparison</h2>
            <Badge variant="outline" className="px-3 py-1">
              {filteredData.length} common markets
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

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredData.map((item) => {
            const fundingDiffAbs = Math.abs(item.fundingDiff);
            const isSignificantDiff = fundingDiffAbs > 25;
            const isModerateDiff = fundingDiffAbs > 15;
            
            return (
              <Card key={item.symbol} className="p-3 hover:shadow-md transition-shadow border-l-4" 
                    style={{ borderLeftColor: isSignificantDiff ? 'rgb(239, 68, 68)' : isModerateDiff ? 'rgb(245, 158, 11)' : 'rgb(34, 197, 94)' }}>
                <div className="space-y-3">
                  {/* Header with improved layout */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{item.base}</span>
                      <span className="text-xs text-muted-foreground font-medium">/USD</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.isArbitrageOpportunity && (
                        <Badge variant="destructive" className="text-xs px-2 py-0.5">
                          ARB
                        </Badge>
                      )}
                      <Badge 
                        variant={isSignificantDiff ? "destructive" : isModerateDiff ? "secondary" : "outline"} 
                        className="text-xs px-2 py-0.5"
                      >
                        {(item.fundingDiff || 0).toFixed(0)}bp
                      </Badge>
                    </div>
                  </div>

                  {/* Rates with improved visual hierarchy */}
                  <div className="bg-muted/20 rounded-lg p-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium text-muted-foreground">HL</span>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold ${
                          item.hl.fundingRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {item.hl.fundingRate > 0 ? '+' : ''}
                        {((item.hl.fundingRate || 0) * 100).toFixed(3)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-xs font-medium text-muted-foreground">EX</span>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold ${
                          item.ex.fundingRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {item.ex.fundingRate > 0 ? '+' : ''}
                        {((item.ex.fundingRate || 0) * 100).toFixed(3)}%
                      </span>
                    </div>
                  </div>

                  {/* Delta Neutral APY - Prominent Display */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-primary">
                        Delta Neutral APY ({getTimePeriodLabel()})
                      </span>
                      <span className="font-mono font-bold text-primary text-base">
                        {calculateDeltaNeutralAPY(
                          Math.abs(item.fundingDiff) / 10000,
                          timePeriod
                        ).toFixed(timePeriod === 'hours' ? 2 : 1)}%
                      </span>
                    </div>
                  </div>

                  {/* Strategy - Compact Display */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground">Strategy:</div>
                    <div className="flex items-center gap-1">
                      {item.fundingDiff > 0 ? (
                        <>
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">SHORT EX</Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">LONG HL</Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">SHORT HL</Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">LONG EX</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleViewAsset(item.base)}
                    >
                      View {item.base}
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => handleViewAsset(item.base)}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th
                  className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('symbol')}
                >
                  Asset
                </th>
                <th className="text-center p-4 font-semibold">Current Rates</th>
                <th
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('fundingDiff')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Rate Diff
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">
                  <div className="space-y-1">
                    <div>APY</div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setTimePeriod('hours')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          timePeriod === 'hours'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        8H
                      </button>
                      <button
                        onClick={() => setTimePeriod('days')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          timePeriod === 'days'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setTimePeriod('year')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          timePeriod === 'year'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        Year
                      </button>
                    </div>
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">Open Interest</th>
                <th className="text-center p-4 font-semibold">
                  Delta Neutral Strategy
                </th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const fundingDiffAbs = Math.abs(item.fundingDiff);
                const isSignificantDiff = fundingDiffAbs > 25; // More than 25 basis points
                const isModerateDiff = fundingDiffAbs > 15; // More than 15 basis points
                const isLowDiff = fundingDiffAbs > 5; // More than 5 basis points

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-muted/30 transition-all duration-200 group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">
                          {item.base}/USD
                        </div>
                        {item.isArbitrageOpportunity && (
                          <Badge variant="destructive" className="text-xs px-2">
                            Arbitrage
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span
                            className={`font-mono text-sm font-semibold ${
                              item.hl.fundingRate > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.hl.fundingRate > 0 ? '+' : ''}
                            {((item.hl.fundingRate || 0) * 100).toFixed(4)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span
                            className={`font-mono text-sm font-semibold ${
                              item.ex.fundingRate > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.ex.fundingRate > 0 ? '+' : ''}
                            {((item.ex.fundingRate || 0) * 100).toFixed(4)}%
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div
                        className={`font-semibold text-base ${
                          isSignificantDiff
                            ? 'text-red-600'
                            : isModerateDiff
                            ? 'text-orange-600'
                            : isLowDiff
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {item.fundingDiff > 0 ? '+' : ''}
                        {(item.fundingDiff || 0).toFixed(1)}bp
                      </div>
                      {isSignificantDiff && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          High Spread
                        </Badge>
                      )}
                      {isModerateDiff && !isSignificantDiff && (
                        <Badge
                          variant="secondary"
                          className="text-xs mt-1 bg-orange-100 text-orange-800"
                        >
                          Medium Spread
                        </Badge>
                      )}
                      {isLowDiff && !isModerateDiff && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Low Spread
                        </Badge>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="text-center space-y-2">
                        {/* Delta Neutral Strategy APY */}
                        <div className="space-y-1">
                          <div
                            className={`font-mono text-lg font-bold ${
                              item.fundingDiff !== 0
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.fundingDiff !== 0 ? '+' : ''}
                            {calculateDeltaNeutralAPY(
                              item.hlFundingRate,
                              item.exFundingRate,
                              timePeriod
                            ).toFixed(
                              timePeriod === 'hours'
                                ? 4
                                : timePeriod === 'days'
                                ? 3
                                : 1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTimePeriodLabel()} Delta Neutral APY
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-sm">
                            $
                            {((item.hl.openInterest || 0) / 1000000).toFixed(1)}
                            M
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-mono text-sm">
                            $
                            {((item.ex.openInterest || 0) / 1000000).toFixed(1)}
                            M
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-center">
                        <div className="space-y-2">
                          {/* Strategy Recommendation - Always Show */}
                          <div className="space-y-1">
                            {item.fundingDiff > 0 ? (
                              // Extended has higher funding rate - collect funding there
                              <>
                                <div className="flex items-center justify-center gap-2">
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs">
                                    SHORT
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    Extended
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                                    LONG
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    Hyperliquid
                                  </span>
                                </div>
                              </>
                            ) : (
                              // Hyperliquid has higher funding rate - collect funding there
                              <>
                                <div className="flex items-center justify-center gap-2">
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs">
                                    SHORT
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    Hyperliquid
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                                    LONG
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    Extended
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        {/* Asset Details Button */}
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs px-3"
                          onClick={() => handleViewAsset(item.base)}
                        >
                          View {item.base}
                        </Button>

                        {/* Strategy Information */}
                        {item.isArbitrageOpportunity ? (
                          <div className="text-xs space-y-0.5">
                            {item.fundingDiff > 0 ? (
                              <>
                                <div className="text-red-600 font-medium">
                                  Short EX
                                </div>
                                <div className="text-green-600 font-medium">
                                  Long HL
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-red-600 font-medium">
                                  Short HL
                                </div>
                                <div className="text-green-600 font-medium">
                                  Long EX
                                </div>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium">Funding Arbitrage Strategy:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  • <strong>bp</strong>: Basis points (1bp = 0.01%) - Rate
                  difference between exchanges
                </p>
                <p>
                  • <strong>High Spread (&gt;25bp)</strong>: Excellent arbitrage
                  opportunity - worth the gas costs and complexity
                </p>
                <p>
                  • <strong>Medium Spread (15-25bp)</strong>: Good opportunity
                  for larger capital or lower-cost execution
                </p>
                <p>
                  • <strong>Low Spread (5-15bp)</strong>: Marginal opportunity -
                  consider gas costs and slippage
                </p>
                <p>
                  • <strong>Minimal Spread (&lt;5bp)</strong>: Generally not
                  worth trading due to execution costs
                </p>
                <p>
                  • <strong>Strategy</strong>: Go long on the exchange with
                  lower funding, short on higher funding
                </p>
                <p>
                  • <strong>Risk</strong>: Consider price impact, liquidity, and
                  position size limits
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
