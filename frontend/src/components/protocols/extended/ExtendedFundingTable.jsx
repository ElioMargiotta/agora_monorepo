'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';

export function ExtendedFundingTable({ searchQuery = '' }) {
  const [sortBy, setSortBy] = useState('fundingRate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get real Extended Exchange funding data with real-time updates
  const {
    data: fundingData,
    loading,
    error,
    lastUpdate,
  } = useExtendedFunding();

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!fundingData) return [];

    let filtered = fundingData.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const baseLower = (item.base || '').toLowerCase();
      const symbolLower = (item.symbol || '').toLowerCase();
      const displayPair = `${item.base || 'unknown'}/usd`.toLowerCase();

      return (
        baseLower.includes(searchLower) ||
        symbolLower.includes(searchLower) ||
        displayPair.includes(searchLower) ||
        `${item.base || 'unknown'}usd`.toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

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
  }, [fundingData, searchQuery, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate next funding time (Extended Exchange typically uses 8-hour intervals)
  const getNextFundingTime = () => {
    const now = new Date();
    const hours = now.getUTCHours();
    const nextFundingHour = Math.ceil((hours + 1) / 8) * 8; // Next 8-hour interval
    const nextFunding = new Date(now);
    nextFunding.setUTCHours(nextFundingHour, 0, 0, 0);

    if (nextFunding <= now) {
      nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
    }

    const timeDiff = nextFunding - now;
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hoursLeft}h ${minutesLeft}m`;
  };

  if (loading) {
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Failed to load funding data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Funding Rates</h2>
            <Badge variant="outline" className="px-3 py-1">
              {filteredData.length} markets
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Extended
            </Badge>
            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Clock className="h-3 w-3" />
                  <span>Live • Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Next funding: {getNextFundingTime()}</span>
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
                <th
                  className="text-right p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('fundingRate')}
                >
                  Current Rate
                </th>
                <th
                  className="text-right p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('predictedFundingRate')}
                >
                  Predicted Rate
                </th>
                <th
                  className="text-right p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('dailyFundingRate')}
                >
                  Daily APR
                </th>
                <th
                  className="text-right p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('openInterest')}
                >
                  Open Interest
                </th>
                <th
                  className="text-right p-4 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  Mark Price
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const isPositiveRate = (item.fundingRate || 0) > 0;
                const isPositivePredicted =
                  (item.predictedFundingRate || 0) > 0;
                const isPositiveDaily = (item.dailyFundingRate || 0) > 0;

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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-xs font-medium text-muted-foreground">
                            EX
                          </span>
                        </div>
                        {item.maxLeverage > 1 && (
                          <Badge variant="outline" className="text-xs px-2">
                            {item.maxLeverage}x
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-2 font-semibold text-lg ${
                          isPositiveRate ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositiveRate ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>
                          {isPositiveRate ? '+' : ''}
                          {((item.fundingRate || 0) * 100).toFixed(4)}%
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <span
                        className={`font-semibold text-base ${
                          isPositivePredicted
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {isPositivePredicted ? '+' : ''}
                        {((item.predictedFundingRate || 0) * 100).toFixed(4)}%
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <span
                        className={`font-semibold text-base ${
                          isPositiveDaily ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositiveDaily ? '+' : ''}
                        {((item.dailyFundingRate || 0) * 100).toFixed(2)}%
                      </span>
                    </td>

                    <td className="p-4 text-right font-mono font-medium text-base">
                      ${((item.openInterest || 0) / 1000000).toFixed(1)}M
                    </td>

                    <td className="p-4 text-right font-mono font-medium text-base">
                      $
                      {(item.price || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
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
            <div className="text-sm space-y-1">
              <p className="font-medium">Funding Rate Information</p>
              <p className="text-muted-foreground">
                • Positive rates indicate longs pay shorts • Negative rates
                indicate shorts pay longs
              </p>
              <p className="text-muted-foreground">
                • Funding is exchanged every 8 hours at 00:00, 08:00, and 16:00
                UTC
              </p>
              <p className="text-muted-foreground">
                • Daily APR represents the annualized rate based on current
                funding
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
