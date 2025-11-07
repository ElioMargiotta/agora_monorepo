'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, BarChart3 } from 'lucide-react';
import { PairsTable } from '@/components/markets/PairsTable';
import FundingTable from '@/components/markets/FundingTable';
import { ExtendedPairsTable } from '@/components/protocols/extended/ExtendedPairsTable.jsx';
import { ExtendedFundingTable } from '@/components/protocols/extended/ExtendedFundingTable.jsx';
import { ComparisonPairsTable } from '@/components/markets/ComparisonPairsTable';
import { ComparisonFundingTable } from '@/components/markets/ComparisonFundingTable';

export default function MarketsPage() {
  const [activeExchange, setActiveExchange] = useState('hyperliquid'); // 'hyperliquid', 'extended', or 'compare'
  const [activeTab, setActiveTab] = useState('pairs'); // 'pairs' or 'funding'
  const [searchQuery, setSearchQuery] = useState(''); // Shared search state

  // Get the appropriate component based on exchange and tab
  const getActiveComponent = () => {
    if (activeExchange === 'hyperliquid') {
      return activeTab === 'pairs' ? (
        <PairsTable searchQuery={searchQuery} />
      ) : (
        <FundingTable searchQuery={searchQuery} />
      );
    } else if (activeExchange === 'extended') {
      return activeTab === 'pairs' ? (
        <ExtendedPairsTable searchQuery={searchQuery} />
      ) : (
        <ExtendedFundingTable searchQuery={searchQuery} />
      );
    } else {
      // compare
      return activeTab === 'pairs' ? (
        <ComparisonPairsTable searchQuery={searchQuery} />
      ) : (
        <ComparisonFundingTable searchQuery={searchQuery} />
      );
    }
  };

  const getExchangeBadges = () => {
    switch (activeExchange) {
      case 'hyperliquid':
        return (
          <Badge variant="secondary" className="px-3 py-1">
            Hyperliquid
          </Badge>
        );
      case 'extended':
        return (
          <Badge
            variant="secondary"
            className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          >
            Extended Exchange
          </Badge>
        );
      case 'compare':
        return (
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
        );
      default:
        return null;
    }
  };

  const getDescription = () => {
    switch (activeExchange) {
      case 'hyperliquid':
        return 'Real-time trading pairs and funding rates from Hyperliquid';
      case 'extended':
        return 'Real-time trading pairs and funding rates from Extended Exchange';
      case 'compare':
        return 'Compare trading pairs and funding rates across exchanges';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Markets</h1>
            <p className="text-lg text-muted-foreground">{getDescription()}</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Live Data
            </Badge>
            {getExchangeBadges()}
          </div>
        </div>

        {/* Exchange Selection */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={activeExchange === 'hyperliquid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveExchange('hyperliquid')}
            className="min-w-[140px] px-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Hyperliquid
            </div>
          </Button>
          <Button
            variant={activeExchange === 'extended' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveExchange('extended')}
            className="min-w-[140px] px-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Extended Exchange
            </div>
          </Button>
          <Button
            variant={activeExchange === 'compare' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveExchange('compare')}
            className="min-w-[140px] px-6"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare
            </div>
          </Button>
        </div>

        {/* Tab Navigation and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={activeTab === 'pairs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('pairs')}
              className="min-w-[140px] px-6"
            >
              Trading Pairs
            </Button>
            <Button
              variant={activeTab === 'funding' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('funding')}
              className="min-w-[140px] px-6"
            >
              Funding Rates
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                activeExchange === 'compare'
                  ? activeTab === 'pairs'
                    ? 'Search common pairs (e.g., BTC, ETH)...'
                    : 'Search common assets (e.g., BTC, ETH)...'
                  : activeTab === 'pairs'
                  ? 'Search pairs (e.g., BTC, ETH, BTC/USD)...'
                  : 'Search assets (e.g., BTC, ETH)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 h-10"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">{getActiveComponent()}</div>
      </div>
    </div>
  );
}
