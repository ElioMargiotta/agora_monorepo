'use client';

import React, { useState } from 'react';
import { getExtendedMarketNames, useExtendedMarketNames } from '@/lib/protocols/extended/rest';
import {
  ExtendedMarketsWebSocketDashboard,
  ExtendedFundingHistoryDashboard,
  LiveFundingRatesDashboard,
  HistoricalFundingRateChart
} from '@/components/protocols/extended';

/**
 * API Test Page - Extended Markets
 * Displays all available market names from Extended Exchange
 * + Real-time WebSocket connections
 */
export default function ApiTestPage() {
  const { marketNames, loading, error, refetch } = useExtendedMarketNames();
  const [activeTab, setActiveTab] = useState('markets'); // 'markets', 'websocket', 'funding', 'funding-rates', or 'chart'
  const [selectedMarket, setSelectedMarket] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Extended Markets API Test
              </h1>
              <p className="text-gray-600 mt-1">
                Testing Extended Exchange integration with market names & WebSocket
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refetch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('markets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'markets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Market Names ({marketNames.length})
              </button>
              <button
                onClick={() => setActiveTab('websocket')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'websocket'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                WebSocket Real-time
              </button>
              <button
                onClick={() => setActiveTab('funding')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'funding'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Funding History
              </button>
              <button
                onClick={() => setActiveTab('funding-rates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'funding-rates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Live Funding Rates
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Funding Rate Chart
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'markets' && (
          <>
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 font-medium">
                      Fetching market data from Extended Exchange...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Failed to fetch markets
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {error.message}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={refetch}
                          className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Market Names */}
            {marketNames.length > 0 && !loading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Summary */}
                <div className="bg-green-50 border-b border-green-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Successfully loaded {marketNames.length} markets
                      </h3>
                      <p className="text-sm text-green-700">
                        Data fetched from Extended Exchange API
                      </p>
                    </div>
                  </div>
                </div>

                {/* Market Names Grid */}
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Market Names
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {marketNames.map((marketName, index) => (
                      <div
                        key={marketName}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setActiveTab('websocket');
                          setSelectedMarket(marketName);
                          // Could implement: auto-select this market in WebSocket tab
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium text-gray-900">
                            {marketName}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Total Markets:</span>
                      <span className="ml-2 text-gray-900">{marketNames.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">API Endpoint:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">
                        /api/extended/markets
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {marketNames.length === 0 && !loading && !error && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-6m-4 0H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No markets found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Unable to load market data from Extended Exchange.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={refetch}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* WebSocket Tab */}
        {activeTab === 'websocket' && (
          <ExtendedMarketsWebSocketDashboard />
        )}

        {/* Funding History Tab */}
        {activeTab === 'funding' && (
          <ExtendedFundingHistoryDashboard marketNames={marketNames} />
        )}

        {/* Live Funding Rates Tab */}
        {activeTab === 'funding-rates' && (
          <LiveFundingRatesDashboard />
        )}

        {/* Historical Funding Rate Chart Tab */}
        {activeTab === 'chart' && (
          <HistoricalFundingRateChart 
            market={selectedMarket}
            onMarketChange={setSelectedMarket}
            availableMarkets={marketNames}
          />
        )}

        {/* Implementation Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm">
              <h3 className="font-medium text-blue-800">
                Integration Features
              </h3>
              <div className="mt-2 text-blue-700">
                <p><strong>Market Names:</strong> Uses <code className="bg-blue-100 px-1 rounded">useExtendedMarketNames()</code> hook 
                to fetch all available markets from Extended Exchange.</p>
                <p className="mt-1"><strong>WebSocket:</strong> Real-time connections using <code className="bg-blue-100 px-1 rounded">useExtendedWebSocket()</code> 
                for live bid/ask prices and spreads.</p>
                <p className="mt-1"><strong>Funding History:</strong> Historical funding rates with 1h/8h/24h timeframes using REST API.</p>
                <p className="mt-1"><strong>Live Funding Rates:</strong> Real-time funding rates for all markets with selection and filtering.</p>
                <p className="mt-1"><strong>Funding Rate Chart:</strong> Interactive Recharts visualization showing historical trends (24h/7d/30d).</p>
                <p className="mt-1">
                  <strong>Equivalent to:</strong> 
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    curl ... /api/v1/info/markets | jq -r &apos;.data[].name&apos; | sort
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
