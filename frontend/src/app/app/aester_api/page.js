'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { 
  LiveMarketMetrics,
  SymbolsProvider 
} from '../../../components/protocols/aster';

export default function AesterAPIPage() {

  return (
    <SymbolsProvider>
      {({ symbols, isUsingRealData, symbolsLoading, symbolsError }) => (
        <div className="min-h-screen bg-background relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
          
          {/* Animated background shapes */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative container mx-auto px-6 py-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-3">
                    Aster Finance
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Professional <span className="text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">funding rate analysis</span> and market intelligence
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    isUsingRealData 
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                  }`}>
                    {isUsingRealData ? "● Live Data" : "○ Offline"}
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Live Market Metrics Dashboard */}
            <LiveMarketMetrics symbols={symbols} isUsingRealData={isUsingRealData} />

            {/* Footer Information */}
            <div className="mt-12 bg-background border border-border rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">API Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Endpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-foreground">Base URL:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">https://fapi.asterdex.com</code></div>
                      <div><span className="font-medium text-foreground">Funding History:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/fundingRate</code></div>
                      <div><span className="font-medium text-foreground">Current Rates:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/premiumIndex</code></div>
                      <div><span className="font-medium text-foreground">24hr Ticker:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/ticker/24hr</code></div>
                      <div><span className="font-medium text-foreground">Order Book:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/depth</code></div>
                      <div><span className="font-medium text-foreground">Klines/Candlestick:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/klines</code></div>
                      <div><span className="font-medium text-foreground">Exchange Info:</span> <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">GET /fapi/v1/exchangeInfo</code></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-foreground">Funding Interval:</span> <span className="text-muted-foreground">4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)</span></div>
                      <div><span className="font-medium text-foreground">Rate Limits:</span> <span className="text-muted-foreground">2400 requests/minute</span></div>
                      <div><span className="font-medium text-foreground">Authentication:</span> <span className="text-muted-foreground">Public endpoints (no API key required)</span></div>
                      <div><span className="font-medium text-foreground">Symbols Available:</span> <span className="text-muted-foreground">{symbols?.length || 0} perpetual futures</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SymbolsProvider>
  );
}
