'use client';

import { useState } from 'react';
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
  BarChart3,
  Calendar,
  Target,
} from 'lucide-react';
import SpreadHistoryChart from '@/components/charts/SpreadHistoryChart';

export default function SpreadAnalysisPage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timePeriod, setTimePeriod] = useState(30);

  // Popular assets for quick selection
  const popularAssets = [
    'BTC',
    'ETH',
    'SOL',
    'AVAX',
    'MATIC',
    'DOGE',
    'ADA',
    'LINK',
  ];

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
              Spread Analysis
            </h1>
            <p className="text-muted-foreground">
              Historical funding rate spreads between exchanges
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live Data
          </Badge>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Settings</h3>

              <div className="flex flex-wrap gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset</label>
                  <Select
                    value={selectedAsset}
                    onValueChange={setSelectedAsset}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {popularAssets.map((asset) => (
                        <SelectItem key={asset} value={asset}>
                          {asset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select
                    value={timePeriod.toString()}
                    onValueChange={(val) => setTimePeriod(parseInt(val))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Opportunities</div>
                  <div className="text-muted-foreground">Spread tracking</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Historical</div>
                  <div className="text-muted-foreground">Rate analysis</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Time Series</div>
                  <div className="text-muted-foreground">Trend data</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Strategy</div>
                  <div className="text-muted-foreground">Delta neutral</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Asset Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Asset Selection</h3>
            <div className="flex flex-wrap gap-2">
              {popularAssets.map((asset) => (
                <Button
                  key={asset}
                  variant={selectedAsset === asset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAsset(asset)}
                  className="h-8"
                >
                  {asset}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Main Chart */}
        <Card className="p-6">
          <SpreadHistoryChart asset={selectedAsset} timePeriod={timePeriod} />
        </Card>

        {/* Analysis Tips */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              How to Use Spread Analysis
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">
                  ✓ Identify Opportunities
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Look for consistently high spreads (&gt; 0.01%)</li>
                  <li>• Monitor spread volatility patterns</li>
                  <li>• Compare spreads across different assets</li>
                  <li>• Track seasonal or cyclical patterns</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-600">
                  ⚡ Strategy Implementation
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Short higher funding rate exchange</li>
                  <li>• Long lower funding rate exchange</li>
                  <li>• Size positions based on spread magnitude</li>
                  <li>• Monitor for spread convergence signals</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
