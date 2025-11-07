'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
  Eye,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';

export default function FundingTable({ searchQuery = '' }) {
  const { data: fundingData, loading, error } = useHyperliquidFunding();

  const [sortBy, setSortBy] = useState('fundingRate');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(
        field === 'fundingRate' || field === 'volume' ? 'desc' : 'asc'
      );
    }
  };

  const getSortedData = () => {
    if (!fundingData) return [];

    const filtered = fundingData.filter(
      (item) =>
        item?.asset?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'asset') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedData = getSortedData();

  // Get top 3 funding opportunities
  const topOpportunities = fundingData
    ? [...fundingData]
        .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
        .slice(0, 3)
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium">Failed to load funding data</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!sortedData.length) {
    return (
      <div className="text-center py-8">
        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No funding data matches your search</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Opportunities Section */}
      {topOpportunities.length > 0 && !searchQuery && (
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Funding Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topOpportunities.map((opp) => (
                <div
                  key={opp.asset}
                  className="p-5 border border-border rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-card to-muted/30 hover:scale-[1.02] hover:bg-muted/50"
                  onClick={() =>
                    window.open(
                      `https://app.hyperliquid.xyz/trade/${opp.asset}`,
                      '_blank'
                    )
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-foreground">
                      {opp.asset}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`text-xl font-bold ${
                        opp.fundingRate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {opp.fundingRate > 0 ? '+' : ''}
                      {opp.fundingRate.toFixed(3)}%
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {opp.fundingRate > 0 ? 'Pay shorts' : 'Pay longs'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Funding Table */}
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-semibold">Funding Rates</h2>
            <Badge variant="outline" className="px-3 py-1">
              {sortedData.length} pairs
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Hyperliquid
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th
                    className="px-8 py-5 text-left cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                    onClick={() => handleSort('asset')}
                  >
                    <div className="flex items-center gap-2">
                      Asset
                      {sortBy === 'asset' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                    onClick={() => handleSort('fundingRate')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Funding Rate (8h)
                      {sortBy === 'fundingRate' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                    onClick={() => handleSort('annualizedRate')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Annualized
                      {sortBy === 'annualizedRate' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                    onClick={() => handleSort('nextFunding')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Next Funding
                      {sortBy === 'nextFunding' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-8 py-5 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => {
                  const isPositiveFunding = item.fundingRate > 0;
                  const rateColor = isPositiveFunding
                    ? 'text-green-600'
                    : 'text-red-600';

                  return (
                    <tr
                      key={item.asset}
                      className="hover:bg-muted/30 cursor-pointer transition-all duration-200 group"
                      onClick={() =>
                        window.open(
                          `https://app.hyperliquid.xyz/trade/${item.asset}`,
                          '_blank'
                        )
                      }
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg">
                            {item.asset}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              HL
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="space-y-1">
                          <div className={`font-bold text-lg ${rateColor}`}>
                            {isPositiveFunding ? '+' : ''}
                            {item.fundingRate.toFixed(3)}%
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {isPositiveFunding
                              ? 'Longs pay shorts'
                              : 'Shorts pay longs'}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className={`font-bold text-base ${rateColor}`}>
                          {isPositiveFunding ? '+' : ''}
                          {item.annualizedRate.toFixed(1)}%
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="text-sm text-muted-foreground font-medium">
                          {item.nextFunding}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            size="sm"
                            className="px-6 group-hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://app.hyperliquid.xyz/trade/${item.asset}`,
                                '_blank'
                              );
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
                                `https://app.hyperliquid.xyz/trade/${item.asset}`,
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
          </div>
        </div>
      </Card>
    </div>
  );
}
