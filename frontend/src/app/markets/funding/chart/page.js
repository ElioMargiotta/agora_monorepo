'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { HistoricalFundingRateChart } from '@/components/protocols/extended';
import { useExtendedMarketNames } from '@/lib/protocols/extended/rest';

/**
 * Standalone Funding Rate Chart Page
 * Dedicated page for viewing historical funding rate charts
 */
export default function FundingRateChartPage() {
  const router = useRouter();
  const { marketNames, loading: marketsLoading } = useExtendedMarketNames();
  const [selectedMarket, setSelectedMarket] = useState('');

  // Auto-select first market when available
  useEffect(() => {
    if (marketNames.length > 0 && !selectedMarket) {
      setSelectedMarket(marketNames[0]);
    }
  }, [marketNames, selectedMarket]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Funding Rate Charts
            </h1>
            <p className="text-muted-foreground">
              Historical funding rate analysis with interactive charts
            </p>
          </div>
          <div className="ml-auto">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Data
            </div>
          </div>
        </div>

        {/* Quick Market Selection */}
        {!marketsLoading && marketNames.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Market Selection
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {marketNames.slice(0, 24).map((market) => (
                <button
                  key={market}
                  onClick={() => setSelectedMarket(market)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedMarket === market
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {market}
                </button>
              ))}
            </div>
            {marketNames.length > 24 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 24 markets. Use the dropdown in the chart for complete list.
              </p>
            )}
          </div>
        )}

        {/* Main Chart */}
        <HistoricalFundingRateChart 
          market={selectedMarket}
          onMarketChange={setSelectedMarket}
          availableMarkets={marketNames}
        />

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Interactive Charts</h3>
            </div>
            <p className="text-gray-600 text-sm">
              View funding rate trends over 24 hours, 7 days, or 30 days with hourly data points. 
              Hover over chart points for detailed information.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Real-time Data</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Charts use live data from Extended Exchange API with up to 1000 data points 
              per request for accurate historical analysis.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Statistical Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">
              View current, average, minimum, and maximum funding rates with color-coded 
              visualization for positive and negative rates.
            </p>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                How to Use Funding Rate Charts
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Select a market:</strong> Use the dropdown or quick selection buttons</li>
                  <li><strong>Choose time period:</strong> 24h for short-term, 7d/30d for trends</li>
                  <li><strong>Interpret colors:</strong> Red = longs pay shorts, Green = shorts pay longs</li>
                  <li><strong>Analyze patterns:</strong> Look for cycles and extreme values</li>
                  <li><strong>Use statistics:</strong> Check min/max/average for context</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
