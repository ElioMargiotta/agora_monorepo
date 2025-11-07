import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesktopFallback } from '@/components/ui/ComingSoon';
import { 
  TrendingUp, 
  Wallet, 
  AlertCircle,
  Activity,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

// Dashboard overview page - optimized for Base Mini App guidelines
export default function DashboardPage() {
  const dashboardContent = (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your funding opportunities and portfolio performance
          </p>
        </div>

        {/* Key Metrics - Mobile optimized grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Total Funding APR</h3>
                <p className="text-2xl font-bold text-green-500">+12.34%</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">24h change: +0.45%</p>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Active Positions</h3>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Across 4 chains</p>
          </Card>

          <Card className="p-4 md:p-6 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Top Opportunity</h3>
                <p className="text-lg font-semibold">ETH-USD</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">GMX: +15.67% APR</p>
          </Card>
        </div>

        {/* Quick Actions - Primary CTAs */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              size="lg" 
              className="w-full justify-between"
              asChild
            >
              <a href="/app/funding-comparison">
                <span>View Markets</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full justify-between"
              asChild
            >
              <a href="/app/portfolio">
                <span>Portfolio</span>
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Market Activity</h2>
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Connect your wallet</p>
              <p className="text-sm text-muted-foreground">
                View personalized data and start tracking funding opportunities
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <DesktopFallback 
      comingSoonTitle="Dashboard Coming Soon!"
      comingSoonDescription="We're building an amazing dashboard experience for mobile. Stay tuned for real-time portfolio tracking, funding opportunities, and more!"
    >
      {dashboardContent}
    </DesktopFallback>
  );
}
