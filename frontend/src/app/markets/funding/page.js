'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

/**
 * Funding Rates Page - Extended Exchange
 * Displays current funding rates for all markets with selection and filtering
 */

// Hook to fetch funding rates
const useFundingRates = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchFundingRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/extended/funding', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ERROR') {
        throw new Error(result.error?.message || 'Failed to fetch funding rates');
      }

      setData(result.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching funding rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundingRates();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchFundingRates, 30000);
    return () => clearInterval(interval);
  }, [fetchFundingRates]);

  return { data, loading, error, lastUpdate, refetch: fetchFundingRates };
};

export default function FundingRatesPage() {
  const router = useRouter();
  const { data: fundingRates, loading, error, lastUpdate, refetch } = useFundingRates();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fundingRate'); // 'fundingRate', 'dailyRate', 'openInterest', 'price'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedMarkets, setSelectedMarkets] = useState(new Set());
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'positive', 'negative', 'high', 'selected'

  // Filter and sort data
  const filteredAndSortedData = fundingRates
    .filter((market) => {
      // Search filter
      if (searchTerm && !market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !market.coin.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      switch (filterBy) {
        case 'positive':
          return market.fundingRate > 0;
        case 'negative':
          return market.fundingRate < 0;
        case 'high':
          return Math.abs(market.fundingRate) > 0.0001; // > 0.01%
        case 'selected':
          return selectedMarkets.has(market.symbol);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'fundingRate':
          aVal = a.fundingRate;
          bVal = b.fundingRate;
          break;
        case 'dailyRate':
          aVal = a.dailyFundingRate;
          bVal = b.dailyFundingRate;
          break;
        case 'openInterest':
          aVal = a.openInterest;
          bVal = b.openInterest;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        default:
          aVal = a.symbol;
          bVal = b.symbol;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Helper functions
  const formatFundingRate = (rate) => {
    const percentage = rate * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`;
  };

  const formatDollarAmount = (amount) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getFundingRateColor = (rate) => {
    if (rate > 0) return 'text-red-600'; // Positive = Longs pay shorts
    if (rate < 0) return 'text-green-600'; // Negative = Shorts pay longs
    return 'text-gray-600';
  };

  const toggleMarketSelection = (symbol) => {
    const newSelected = new Set(selectedMarkets);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedMarkets(newSelected);
  };

  const selectAllMarkets = () => {
    setSelectedMarkets(new Set(fundingRates.map(m => m.symbol)));
  };

  const clearSelection = () => {
    setSelectedMarkets(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Extended Exchange Funding Rates
            </h1>
            <p className="text-muted-foreground">
              Real-time funding rates for all Extended Exchange markets
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Live Data
            </Badge>
            {lastUpdate && (
              <Badge variant="secondary" className="text-xs">
                Updated: {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Market Selection & Filters</h3>
              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Markets</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="BTC, ETH, SOL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter</label>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Markets</SelectItem>
                    <SelectItem value="positive">Positive Rates</SelectItem>
                    <SelectItem value="negative">Negative Rates</SelectItem>
                    <SelectItem value="high">High Rates (&gt;0.01%)</SelectItem>
                    <SelectItem value="selected">Selected Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundingRate">Funding Rate</SelectItem>
                    <SelectItem value="dailyRate">Daily Rate</SelectItem>
                    <SelectItem value="openInterest">Open Interest</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest First</SelectItem>
                    <SelectItem value="asc">Lowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection Controls */}
            {fundingRates.length > 0 && (
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedMarkets.size} of {fundingRates.length} markets selected
                </div>
                <div className="flex gap-2">
                  <Button onClick={selectAllMarkets} variant="outline" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Loading State */}
        {loading && fundingRates.length === 0 && (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading funding rates...</span>
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Failed to load funding rates
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="mt-3">
                    <Button onClick={refetch} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Funding Rates Table */}
        {!loading && !error && filteredAndSortedData.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Select</th>
                    <th className="text-left p-4 font-medium">Market</th>
                    <th className="text-right p-4 font-medium">Price</th>
                    <th className="text-right p-4 font-medium">Funding Rate</th>
                    <th className="text-right p-4 font-medium">Daily Rate</th>
                    <th className="text-right p-4 font-medium">Open Interest</th>
                    <th className="text-right p-4 font-medium">Next Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((market, index) => (
                    <tr
                      key={market.symbol}
                      className={`border-b hover:bg-muted/25 ${
                        selectedMarkets.has(market.symbol) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedMarkets.has(market.symbol)}
                          onChange={() => toggleMarketSelection(market.symbol)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{market.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {market.coin}/{market.quote}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono">
                        {formatDollarAmount(market.price)}
                      </td>
                      <td className={`p-4 text-right font-mono font-semibold ${getFundingRateColor(market.fundingRate)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {market.fundingRate > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : market.fundingRate < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {formatFundingRate(market.fundingRate)}
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono ${getFundingRateColor(market.dailyFundingRate)}`}>
                        {formatFundingRate(market.dailyFundingRate)}
                      </td>
                      <td className="p-4 text-right font-mono">
                        {formatDollarAmount(market.openInterest)}
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(market.nextFundingTime).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && !error && filteredAndSortedData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Markets Shown</div>
                  <div className="text-2xl font-bold">{filteredAndSortedData.length}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Positive Rates</div>
                  <div className="text-2xl font-bold">
                    {filteredAndSortedData.filter(m => m.fundingRate > 0).length}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Negative Rates</div>
                  <div className="text-2xl font-bold">
                    {filteredAndSortedData.filter(m => m.fundingRate < 0).length}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Selected</div>
                  <div className="text-2xl font-bold">{selectedMarkets.size}</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedData.length === 0 && fundingRates.length > 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No markets match your filters</h3>
              <p className="text-muted-foreground">
                Try adjusting your search term or filter settings
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

        {/* Info Panel */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm">
              <h3 className="font-medium text-blue-800">Understanding Funding Rates</h3>
              <div className="mt-2 text-blue-700">
                <p><strong>Positive rates (red):</strong> Longs pay shorts - Market is bullish</p>
                <p><strong>Negative rates (green):</strong> Shorts pay longs - Market is bearish</p>
                <p><strong>Daily rate:</strong> Approximate daily funding cost (8h rate × 3)</p>
                <p><strong>Data source:</strong> Extended Exchange API - Updates every 30 seconds</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
