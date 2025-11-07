'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Target,
  Wallet,
  Activity,
  PieChart,
} from 'lucide-react';
import {
  useHyperliquidFunding,
  useHyperliquidMarkets,
} from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding, useExtendedMarkets } from '@/lib/protocols/extended/rest';
import { calculateDeltaNeutralAPY, debugRates } from '@/lib/apyCalculations';
import SpreadHistoryChart from '@/components/charts/SpreadHistoryChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetName = params.asset?.toUpperCase();

  // State for user inputs
  const [hlAmount, setHlAmount] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [timePeriod, setTimePeriod] = useState('year'); // 'hours', 'days', 'year'
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by only rendering after client hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get data from both exchanges
  const { data: hlFundingData, loading: hlFundingLoading } =
    useHyperliquidFunding();
  const { data: hlPairsData, loading: hlPairsLoading } =
    useHyperliquidMarkets();
  const { data: exFundingData, loading: exFundingLoading } =
    useExtendedFunding();
  const { data: exPairsData, loading: exPairsLoading } = useExtendedMarkets();

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'hours':
        return '8-Hour';
      case 'days':
        return 'Daily';
      case 'year':
        return 'Annual';
      default:
        return 'Annual';
    }
  };

  // Find current asset data with real funding rates
  const assetData = useMemo(() => {
    if (!assetName) return null;

    const hlFunding = hlFundingData?.find(
      (item) => item.coin?.toUpperCase() === assetName
    );
    const hlPairs = hlPairsData?.find(
      (item) => item.coin?.toUpperCase() === assetName
    );
    const exFunding = exFundingData?.find(
      (item) => item.base?.toUpperCase() === assetName
    );
    const exPairs = exPairsData?.find(
      (item) => item.base?.toUpperCase() === assetName
    );

    return {
      asset: assetName,
      hyperliquid: {
        funding: hlFunding,
        pairs: hlPairs,
        fundingRate: hlFunding?.funding || 0,
        price: hlPairs?.markPx || 0,
        volume24h: hlPairs?.volume24h || 0,
        openInterest: hlFunding?.openInterest || 0,
      },
      extended: {
        funding: exFunding,
        pairs: exPairs,
        fundingRate: exFunding?.fundingRate || 0, // Keep in decimal format now
        price: exPairs?.price || 0,
        volume24h: exPairs?.volume24h || 0,
        openInterest: exFunding?.openInterest || 0,
      },
    };
  }, [assetName, hlFundingData, hlPairsData, exFundingData, exPairsData]);

  // Calculate current delta neutral APY using real data and standardized function
  const currentDeltaNeutralAPY = useMemo(() => {
    if (!assetData) return { hours: 0, days: 0, year: 0 };

    const hlRate = assetData.hyperliquid.fundingRate; // Decimal format
    const exRate = assetData.extended.fundingRate; // Percentage format

    // Debug rates for this asset
    if (assetData.asset) {
      debugRates(assetData.asset, hlRate, exRate);
    }

    return {
      hours: calculateDeltaNeutralAPY(hlRate, exRate, 'hours'),
      days: calculateDeltaNeutralAPY(hlRate, exRate, 'days'),
      year: calculateDeltaNeutralAPY(hlRate, exRate, 'year'),
    };
  }, [assetData]);

  // Mock user balances (in real app, this would come from wallet connection)
  const userBalances = {
    hyperliquid: {
      total: 15420.5,
      available: 12330.25,
      inPosition: 3090.25,
    },
    extended: {
      total: 8750.3,
      available: 7200.15,
      inPosition: 1550.15,
    },
  };

  // Mock open positions (in real app, this would come from API)
  const openPositions = [
    // No positions by default - user starts with empty portfolio
  ];

  const loading =
    hlFundingLoading || hlPairsLoading || exFundingLoading || exPairsLoading;

  // Prevent hydration mismatch - show loading during SSR and initial hydration
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Asset Not Found</h1>
            <p className="text-muted-foreground">
              The asset {assetName} was not found on either exchange.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNeutralTrade = () => {
    if (!hlAmount || !exAmount) {
      alert('Please enter amounts for both exchanges');
      return;
    }

    // In real app, this would execute the neutral strategy
    alert(
      `Executing neutral strategy with $${hlAmount} on Hyperliquid and $${exAmount} on Extended Exchange`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">
              {assetData.asset}/USD
            </h1>
            <p className="text-lg text-muted-foreground">
              Cross-exchange analysis and trading
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Side - Current APY Display (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Delta Neutral Strategy APY */}
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Current Delta Neutral Strategy APY
                  </h2>
                  <div className="flex items-center gap-4">
                    {/* Time Period Selector */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                      {['hours', 'days', 'year'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setTimePeriod(period)}
                          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                            timePeriod === period
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {period === 'hours'
                            ? '8H'
                            : period === 'days'
                            ? 'Daily'
                            : 'Annual'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Live APY (Real Data)</span>
                    </div>
                  </div>
                </div>

                {/* Current APY Display */}
                <div className="bg-gray-750 dark:bg-none rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Current {getTimePeriodLabel()} Delta Neutral APY
                    </h3>
                    <div className="text-6xl font-bold text-green-600">
                      {currentDeltaNeutralAPY[timePeriod] > 0 ? '+' : ''}
                      {currentDeltaNeutralAPY[timePeriod].toFixed(
                        timePeriod === 'hours'
                          ? 4
                          : timePeriod === 'days'
                          ? 3
                          : 1
                      )}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Based on current funding rates from both exchanges
                    </div>
                    {Math.abs(
                      assetData.hyperliquid.fundingRate -
                        assetData.extended.fundingRate
                    ) > 0.0001 && (
                      <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="text-sm space-y-2">
                          <div className="font-medium">Current Strategy:</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-red-600 font-medium">
                                SHORT{' '}
                                {assetData.hyperliquid.fundingRate >
                                assetData.extended.fundingRate
                                  ? 'Hyperliquid'
                                  : 'Extended Exchange'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Higher funding rate:{' '}
                                {assetData.hyperliquid.fundingRate >
                                assetData.extended.fundingRate
                                  ? (
                                      assetData.hyperliquid.fundingRate * 100
                                    ).toFixed(3)
                                  : (
                                      assetData.extended.fundingRate * 100
                                    ).toFixed(3)}
                                %
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-600 font-medium">
                                LONG{' '}
                                {assetData.hyperliquid.fundingRate >
                                assetData.extended.fundingRate
                                  ? 'Extended Exchange'
                                  : 'Hyperliquid'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Lower funding rate:{' '}
                                {assetData.hyperliquid.fundingRate <
                                assetData.extended.fundingRate
                                  ? (
                                      assetData.hyperliquid.fundingRate * 100
                                    ).toFixed(3)
                                  : (
                                      assetData.extended.fundingRate * 100
                                    ).toFixed(3)}
                                %
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Funding Rate Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <h4 className="font-semibold">Hyperliquid Funding</h4>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        assetData.hyperliquid.fundingRate > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {assetData.hyperliquid.fundingRate > 0 ? '+' : ''}
                      {(assetData.hyperliquid.fundingRate * 100).toFixed(4)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      8-hour rate
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <h4 className="font-semibold">
                        Extended Exchange Funding
                      </h4>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        assetData.extended.fundingRate > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {assetData.extended.fundingRate > 0 ? '+' : ''}
                      {(assetData.extended.fundingRate * 100).toFixed(4)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      8-hour rate
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Historical Spread Analysis */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Historical Spread Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      30-day funding rate spread between exchanges
                    </p>
                  </div>
                </div>

                <SpreadHistoryChart asset={assetName} timePeriod={30} />
              </div>
            </Card>
          </div>

          {/* Right Side - Trading Panel (1/4 width) */}
          <div className="space-y-6">
            {/* User Balances */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Your Balances</h3>
                </div>

                {/* Hyperliquid Balance */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-lg">Hyperliquid</span>
                  </div>
                  <div className="ml-6 space-y-2 text-base">
                    <div className="flex justify-between py-1">
                      <span>Total:</span>
                      <span className="font-mono font-semibold">
                        ${userBalances.hyperliquid.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Available:</span>
                      <span className="font-mono font-semibold text-green-600">
                        ${userBalances.hyperliquid.available.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>In Position:</span>
                      <span className="font-mono font-semibold text-yellow-600">
                        ${userBalances.hyperliquid.inPosition.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Extended Balance */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-semibold text-lg">
                      Extended Exchange
                    </span>
                  </div>
                  <div className="ml-6 space-y-2 text-base">
                    <div className="flex justify-between py-1">
                      <span>Total:</span>
                      <span className="font-mono font-semibold">
                        ${userBalances.extended.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Available:</span>
                      <span className="font-mono font-semibold text-green-600">
                        ${userBalances.extended.available.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>In Position:</span>
                      <span className="font-mono font-semibold text-yellow-600">
                        ${userBalances.extended.inPosition.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trading Inputs */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Neutral Strategy</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Hyperliquid Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={hlAmount}
                      onChange={(e) => setHlAmount(e.target.value)}
                      className="mt-2 h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Extended Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={exAmount}
                      onChange={(e) => setExAmount(e.target.value)}
                      className="mt-2 h-12 text-lg"
                    />
                  </div>

                  <Button
                    className="w-full h-14 text-lg font-semibold"
                    onClick={handleNeutralTrade}
                    disabled={!hlAmount || !exAmount}
                  >
                    <Activity className="h-5 w-5 mr-3" />
                    Execute Neutral Trade
                  </Button>

                  <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    This will execute opposite positions on both exchanges to
                    capture funding rate differences while remaining market
                    neutral.
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Current Metrics</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium">HL Funding:</span>
                    <span
                      className={`font-mono text-base font-semibold ${
                        assetData.hyperliquid.fundingRate > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {assetData.hyperliquid.fundingRate > 0 ? '+' : ''}
                      {(assetData.hyperliquid.fundingRate * 100).toFixed(4)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium">EX Funding:</span>
                    <span
                      className={`font-mono text-base font-semibold ${
                        assetData.extended.fundingRate > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {assetData.extended.fundingRate > 0 ? '+' : ''}
                      {(assetData.extended.fundingRate * 100).toFixed(4)}%
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium">Price Diff:</span>
                    <span className="font-mono text-base font-semibold">
                      $
                      {Math.abs(
                        assetData.hyperliquid.price - assetData.extended.price
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium">
                      Funding Spread:
                    </span>
                    <span className="font-mono text-base font-semibold">
                      {Math.abs(
                        (assetData.hyperliquid.fundingRate -
                          assetData.extended.fundingRate) *
                          10000
                      ).toFixed(1)}
                      bp
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium">Current APY:</span>
                    <span className="font-mono text-base font-semibold text-green-600">
                      +{currentDeltaNeutralAPY.year.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Open Positions */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <h2 className="text-2xl font-semibold">Open Positions</h2>
            </div>

            {openPositions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Exchange</th>
                      <th className="text-left p-4 font-semibold">Side</th>
                      <th className="text-right p-4 font-semibold">Size</th>
                      <th className="text-right p-4 font-semibold">
                        Entry Price
                      </th>
                      <th className="text-right p-4 font-semibold">
                        Current Price
                      </th>
                      <th className="text-right p-4 font-semibold">PnL</th>
                      <th className="text-right p-4 font-semibold">
                        Margin Used
                      </th>
                      <th className="text-center p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((position) => (
                      <tr
                        key={position.id}
                        className="border-b hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                position.exchange === 'Hyperliquid'
                                  ? 'bg-blue-500'
                                  : 'bg-purple-500'
                              }`}
                            ></div>
                            {position.exchange}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              position.side === 'Long'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {position.side}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono">
                          {position.size} {assetData.asset}
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.entryPrice.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.currentPrice.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <div
                            className={`font-mono ${
                              position.pnl > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {position.pnl > 0 ? '+' : ''}$
                            {position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnl > 0 ? '+' : ''}
                              {position.pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">
                          ${position.margin.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Close
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Open Positions</h3>
                <p>
                  You don&apos;t have any open positions for {assetData.asset}{' '}
                  at the moment.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
