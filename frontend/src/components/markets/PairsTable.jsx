'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ExternalLink, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHyperliquidMarkets } from '@/hooks/protocols/hyperliquid';

export function PairsTable({ searchQuery = '' }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('volume24h');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get real Hyperliquid market data with real-time updates
  const {
    data: marketData,
    loading,
    error,
    lastUpdate,
  } = useHyperliquidMarkets();

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!marketData) return [];

    let filtered = marketData.filter((pair) => {
      const searchLower = searchQuery.toLowerCase();
      const baseLower = pair.base.toLowerCase();
      const symbolLower = pair.symbol.toLowerCase();
      const displayPair = `${pair.base}/usd`.toLowerCase(); // Match displayed format

      return (
        baseLower.includes(searchLower) ||
        symbolLower.includes(searchLower) ||
        displayPair.includes(searchLower) ||
        `${pair.base}usd`.toLowerCase().includes(searchLower)
      ); // Also match without slash
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
  }, [marketData, searchQuery, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (pair) => {
    router.push(`/app/trade/pairs/hyperliquid/${pair.base}`);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="animate-pulse bg-muted h-6 w-32 rounded"></div>
          <Badge variant="outline" className="animate-pulse">
            Loading...
          </Badge>
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-4 p-3 rounded-lg border"
            >
              <div className="bg-muted h-4 w-20 rounded"></div>
              <div className="bg-muted h-4 w-24 rounded"></div>
              <div className="bg-muted h-4 w-16 rounded"></div>
              <div className="bg-muted h-4 w-20 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Failed to load market data</p>
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
            <h2 className="text-2xl font-semibold">Trading Pairs</h2>
            <Badge variant="outline" className="px-3 py-1">
              {filteredData.length} pairs
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Hyperliquid
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
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('symbol')}
                >
                  Pair{' '}
                  {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-primary text-right transition-colors"
                  onClick={() => handleSort('price')}
                >
                  Price{' '}
                  {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-primary text-right transition-colors"
                  onClick={() => handleSort('change24h')}
                >
                  24h Change{' '}
                  {sortBy === 'change24h' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-primary text-right transition-colors"
                  onClick={() => handleSort('volume24h')}
                >
                  24h Volume{' '}
                  {sortBy === 'volume24h' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-primary text-right transition-colors"
                  onClick={() => handleSort('fundingRate')}
                >
                  Funding APR{' '}
                  {sortBy === 'fundingRate' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((pair) => {
                const isPositiveChange = pair.change24h >= 0;
                const isPositiveFunding = pair.fundingRate >= 0;

                return (
                  <tr
                    key={pair.symbol}
                    className="hover:bg-muted/30 cursor-pointer transition-all duration-200 group"
                    onClick={() => handleRowClick(pair)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">
                          {pair.base}/USD
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-medium text-muted-foreground">
                            HL
                          </span>
                        </div>
                        {pair.maxLeverage > 1 && (
                          <Badge variant="outline" className="text-xs px-2">
                            {pair.maxLeverage}x
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-lg font-semibold">
                      <span className="transition-all duration-300 hover:scale-105">
                        $
                        {(pair.price || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-2 ${
                          isPositiveChange ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositiveChange ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold text-base">
                          {isPositiveChange ? '+' : ''}
                          {(pair.change24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono font-medium text-base">
                      ${((pair.volume24h || 0) / 1000000).toFixed(1)}M
                    </td>

                    <td className="p-4 text-right">
                      {pair.fundingRate !== null ? (
                        <span
                          className={`font-semibold text-base ${
                            isPositiveFunding
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {isPositiveFunding ? '+' : ''}
                          {(pair.fundingRate || 0).toFixed(3)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          className="px-6 group-hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(pair);
                          }}
                        >
                          Trade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://app.hyperliquid.xyz/trade/${pair.base}`,
                              '_blank'
                            );
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredData.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">
                No trading pairs found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
