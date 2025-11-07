import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

export default function LoadingCard() {
  return (
    <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardContent className="py-12 px-6">
        {/* Main loading indicator */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 animate-ping"></div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Loading Funding Rates
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetching real-time data from multiple exchanges...
            </p>
          </div>

          {/* Enhanced skeleton for table structure */}
          <div className="w-full max-w-4xl space-y-4 mt-8">
            {/* Header skeleton */}
            <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
              <div className="h-4 bg-muted/60 rounded animate-pulse w-20"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-24"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-16"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-20"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-18"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-16"></div>
            </div>
            
            {/* Row skeletons with staggered animations */}
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-muted/60 rounded-full"></div>
                  <div className="h-4 bg-muted/60 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-20 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-16 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-24 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-18 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-20 animate-shimmer"></div>
              </div>
            ))}
          </div>

          {/* Platform indicators */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="text-xs text-muted-foreground">Loading from:</div>
            {['Hyperliquid', 'Extended', 'Aster', 'Lighter', 'Paradex'].map((platform, i) => (
              <div 
                key={platform}
                className="flex items-center space-x-1 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping"></div>
                <span className="text-xs text-muted-foreground">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
