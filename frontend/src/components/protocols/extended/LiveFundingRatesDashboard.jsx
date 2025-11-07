'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Live Funding Rates Dashboard for API Test Page
 * Shows current funding rates for all Extended Exchange markets with selection capability
 */

// Hook to fetch current funding rates
const useLiveFundingRates = () => {
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

/**
 * Funding Rate Card Component
 */
const FundingRateCard = ({ market, isSelected, onToggleSelect }) => {
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
    if (rate > 0) return 'text-red-600 bg-red-50'; // Positive = Longs pay shorts
    if (rate < 0) return 'text-green-600 bg-green-50'; // Negative = Shorts pay longs
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
      onClick={() => onToggleSelect(market.symbol)}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{market.symbol}</h3>
          <p className="text-sm text-gray-500">{market.coin}/{market.quote}</p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(market.symbol)}
            className="w-4 h-4 text-blue-600 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div className="space-y-2">
        {/* Current Price */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Price:</span>
          <span className="font-mono font-medium">
            {formatDollarAmount(market.price)}
          </span>
        </div>

        {/* Funding Rate */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Funding Rate:</span>
          <div className={`px-2 py-1 rounded text-sm font-mono font-bold ${getFundingRateColor(market.fundingRate)}`}>
            {formatFundingRate(market.fundingRate)}
          </div>
        </div>

        {/* Daily Rate */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Daily Rate:</span>
          <span className={`font-mono text-sm ${market.dailyFundingRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatFundingRate(market.dailyFundingRate)}
          </span>
        </div>

        {/* Open Interest */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Open Interest:</span>
          <span className="font-mono text-sm">
            {formatDollarAmount(market.openInterest)}
          </span>
        </div>

        {/* Next Funding */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Next Funding:</span>
            <span className="text-xs text-gray-500">
              {new Date(market.nextFundingTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Live Funding Rates Dashboard Component
 */
export default function LiveFundingRatesDashboard() {
  const { data: fundingRates, loading, error, lastUpdate, refetch } = useLiveFundingRates();
  const [selectedMarkets, setSelectedMarkets] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fundingRate'); // 'fundingRate', 'symbol', 'openInterest'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'positive', 'negative', 'selected'

  // Filter and sort funding rates
  const filteredAndSortedRates = fundingRates
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
        case 'selected':
          return selectedMarkets.has(market.symbol);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'fundingRate':
          return Math.abs(b.fundingRate) - Math.abs(a.fundingRate);
        case 'openInterest':
          return b.openInterest - a.openInterest;
        case 'symbol':
        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });

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
    setSelectedMarkets(new Set(filteredAndSortedRates.map(m => m.symbol)));
  };

  const clearSelection = () => {
    setSelectedMarkets(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Live Funding Rates
            </h2>
            <p className="text-gray-600">
              Current funding rates for all Extended Exchange markets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {lastUpdate && (
              <div className="text-xs text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="BTC, ETH, SOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Markets</option>
              <option value="positive">Positive Rates</option>
              <option value="negative">Negative Rates</option>
              <option value="selected">Selected Only</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fundingRate">Funding Rate</option>
              <option value="openInterest">Open Interest</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>

          {/* Selection Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selection</label>
            <div className="flex gap-2">
              <button
                onClick={selectAllMarkets}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                All ({filteredAndSortedRates.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredAndSortedRates.length}</div>
            <div className="text-sm text-gray-600">Markets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredAndSortedRates.filter(m => m.fundingRate > 0).length}
            </div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredAndSortedRates.filter(m => m.fundingRate < 0).length}
            </div>
            <div className="text-sm text-gray-600">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedMarkets.size}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && fundingRates.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading funding rates...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white border border-red-200 rounded-lg p-6">
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
                  <button
                    onClick={refetch}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funding Rates Grid */}
      {!loading && !error && filteredAndSortedRates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedRates.map((market) => (
            <FundingRateCard
              key={market.symbol}
              market={market}
              isSelected={selectedMarkets.has(market.symbol)}
              onToggleSelect={toggleMarketSelection}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAndSortedRates.length === 0 && fundingRates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No markets match your filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search term or filter settings
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBy('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* API Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 text-sm">
            <h3 className="font-medium text-blue-800">Live Funding Rates Features</h3>
            <div className="mt-2 text-blue-700">
              <p><strong>Real-time data:</strong> Auto-refreshes every 30 seconds</p>
              <p><strong>Market selection:</strong> Click cards or checkboxes to select markets</p>
              <p><strong>Color coding:</strong> Red = Longs pay shorts, Green = Shorts pay longs</p>
              <p><strong>API endpoint:</strong> <code className="bg-blue-100 px-1 rounded">/api/extended/funding</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
