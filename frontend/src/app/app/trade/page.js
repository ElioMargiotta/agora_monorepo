'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { ComparisonFundingTable } from '@/components/markets/ComparisonFundingTable';

export default function TradePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Trade</h1>
            <p className="text-lg text-muted-foreground">
              Compare funding rates across exchanges and find arbitrage
              opportunities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Live Data
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                Hyperliquid
              </Badge>
              <span className="text-muted-foreground">vs</span>
              <Badge
                variant="secondary"
                className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                Extended
              </Badge>
            </div>
          </div>
        </div>

        {/* Trading Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg">Funding Arbitrage</h3>
                <p className="text-sm text-muted-foreground">
                  Capture rate differences between exchanges
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-lg">Market Neutral</h3>
                <p className="text-sm text-muted-foreground">
                  Hedge positions across platforms
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-lg">Risk Management</h3>
                <p className="text-sm text-muted-foreground">
                  Automated position sizing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              Funding Rate Opportunities
            </h2>
            <p className="text-muted-foreground">
              Real-time funding rate comparison across Hyperliquid and Extended
              Exchange
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets (e.g., BTC, ETH)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>
        </div>

        {/* Trading Strategy Info */}
        <div className="p-6 bg-muted/20 rounded-lg border">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Delta Neutral Funding Rate Arbitrage
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">How It Works</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • The table shows exactly which platform to SHORT and LONG
                  </li>
                  <li>
                    • Strategy recommendations appear when rate difference
                    &gt;5bp
                  </li>
                  <li>• Go SHORT on the exchange with higher funding rates</li>
                  <li>• Go LONG on the exchange with lower funding rates</li>
                  <li>
                    • Collect funding rate differential every 8 hours
                    automatically
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Reading the Strategy Column</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 📉 SHORT: Platform where you open short positions</li>
                  <li>• 📈 LONG: Platform where you open long positions</li>
                  <li>• Expected Funding: Your profit per 8-hour period</li>
                  <li>• APR: Annualized return from funding differentials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Rate Comparison Table */}
        <ComparisonFundingTable searchQuery={searchQuery} />

        {/* Additional Trading Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                Set Price Alerts
              </Button>
              <Button className="w-full" variant="outline">
                Configure Auto-Trading
              </Button>
              <Button className="w-full" variant="outline">
                View Trading History
              </Button>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Today&apos;s PnL:
                </span>
                <span className="text-sm font-mono text-green-600">
                  +$124.56
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Positions:
                </span>
                <span className="text-sm font-mono">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg. Funding Earned:
                </span>
                <span className="text-sm font-mono">+0.0234%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Success Rate:
                </span>
                <span className="text-sm font-mono">78.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
