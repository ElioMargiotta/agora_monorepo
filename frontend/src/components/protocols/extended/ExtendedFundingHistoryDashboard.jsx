'use client';

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Extended Funding History Dashboard
 * Shows funding rates history for last 1h, 8h, and 24h for all available markets
 */

// Time period configurations
const TIME_PERIODS = {
  '1h': {
    label: '1 Hour',
    hours: 1,
    description: 'Last hour funding rates'
  },
  '8h': {
    label: '8 Hours',
    hours: 8,
    description: 'Last 8 hours funding rates'
  },
  '24h': {
    label: '24 Hours',
    hours: 24,
    description: 'Last 24 hours funding rates'
  }
};

/**
 * Fetch funding history for a specific market and time period
 */
const fetchFundingHistory = async (market, startTime, endTime) => {
  try {
    const response = await fetch(
      `/api/extended/info/${market}/funding?startTime=${startTime}&endTime=${endTime}&limit=1000`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      throw new Error(data.error?.message || 'API returned error');
    }

    return data.data || [];
  } catch (error) {
    console.error(`Error fetching funding history for ${market}:`, error);
    throw error;
  }
};

/**
 * Hook for managing funding history data
 */
const useFundingHistory = (marketNames, selectedPeriod) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    if (!marketNames.length || !selectedPeriod) return;

    setLoading(true);
    setError(null);

    try {
      const now = Date.now();
      const startTime = now - (TIME_PERIODS[selectedPeriod].hours * 60 * 60 * 1000);

      // Fetch funding history for all markets
      const promises = marketNames.slice(0, 10).map(async (market) => {
        try {
          const history = await fetchFundingHistory(market, startTime, now);
          return { market, history, error: null };
        } catch (error) {
          return { market, history: [], error: error.message };
        }
      });

      const results = await Promise.allSettled(promises);

      const newData = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { market, history, error } = result.value;
          newData[market] = { history, error, lastUpdate: new Date() };
        }
      });

      setData(newData);
      setLastUpdate(new Date());
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [marketNames, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdate, refetch: fetchData };
};

/**
 * Funding Rate Card Component
 */
const FundingRateCard = ({ market, marketData, period }) => {
  const { history, error: marketError, lastUpdate } = marketData || {};

  const formatFundingRate = (rate) => {
    if (!rate) return 'N/A';
    const percentage = parseFloat(rate) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLatestRate = () => {
    if (!history || history.length === 0) return null;
    return history[0]; // API returns data sorted by timestamp in descending order
  };

  const getAverageRate = () => {
    if (!history || history.length === 0) return null;
    const sum = history.reduce((acc, rate) => acc + parseFloat(rate.f || 0), 0);
    return (sum / history.length).toString();
  };

  const getMinMaxRates = () => {
    if (!history || history.length === 0) return { min: null, max: null };

    const rates = history.map(r => parseFloat(r.f || 0));
    return {
      min: Math.min(...rates).toString(),
      max: Math.max(...rates).toString()
    };
  };

  const latestRate = getLatestRate();
  const averageRate = getAverageRate();
  const { min: minRate, max: maxRate } = getMinMaxRates();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{market}</h3>
        <div className="text-xs text-gray-500">
          {history ? `${history.length} records` : 'No data'}
        </div>
      </div>

      {marketError ? (
        <div className="text-center py-4">
          <div className="text-sm text-red-600 mb-2">Error: {marketError}</div>
        </div>
      ) : !history || history.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">No funding data available</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Latest Rate */}
          <div className="border-b border-gray-100 pb-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Latest Rate:</span>
              <span className={`font-mono font-semibold ${
                parseFloat(latestRate?.f || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatFundingRate(latestRate?.f)}
              </span>
            </div>
            {latestRate?.T && (
              <div className="text-xs text-gray-400 text-right">
                {formatTimestamp(latestRate.T)}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Average:</span>
              <div className="font-mono font-medium">
                {formatFundingRate(averageRate)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Records:</span>
              <div className="font-medium">
                {history.length}
              </div>
            </div>
          </div>

          {/* Min/Max */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Min:</span>
              <div className="font-mono text-red-600">
                {formatFundingRate(minRate)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Max:</span>
              <div className="font-mono text-green-600">
                {formatFundingRate(maxRate)}
              </div>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main Funding History Dashboard Component
 */
export default function ExtendedFundingHistoryDashboard({ marketNames }) {
  const [selectedPeriod, setSelectedPeriod] = useState('1h');
  const { data, loading, error, lastUpdate, refetch } = useFundingHistory(marketNames, selectedPeriod);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Extended Funding Rates History
            </h2>
            <p className="text-gray-600">
              Funding rates history for Extended Exchange markets
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Period Selection */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(TIME_PERIODS).map(([key, period]) => (
            <button
              key={key}
              onClick={() => handlePeriodChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Period Description */}
        <div className="text-sm text-gray-600">
          {TIME_PERIODS[selectedPeriod].description} • Showing first 10 markets for performance
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdate.toLocaleString()}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading funding rates history...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
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
                  Failed to fetch funding history
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
      {!loading && !error && Object.keys(data).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(data).map(([market, marketData]) => (
            <FundingRateCard
              key={market}
              market={market}
              marketData={marketData}
              period={selectedPeriod}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && Object.keys(data).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">
            No funding rates history found for the selected time period.
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
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
            <h3 className="font-medium text-blue-800">
              Funding History API Details
            </h3>
            <div className="mt-2 text-blue-700">
              <p><strong>Endpoint:</strong> <code className="bg-blue-100 px-1 rounded">/api/v1/info/{`{market}`}/funding</code></p>
              <p><strong>Data:</strong> Funding rates are calculated every minute but applied hourly</p>
              <p><strong>Format:</strong> Rates returned as decimals (multiply by 100 for percentage)</p>
              <p><strong>Sorting:</strong> Data sorted by timestamp in descending order (newest first)</p>
              <p><strong>Limit:</strong> Showing first 10 markets for performance, up to 1000 records per market</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
