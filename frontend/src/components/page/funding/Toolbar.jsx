import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, RefreshCw, Filter, X, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Filters from './Filters';
import { useState } from 'react';

export default function Toolbar({
  selectedPlatforms,
  setSelectedPlatforms,
  handlePlatformToggle,
  handleSelectAll,
  handleClearAll,
  query,
  setQuery,
  fundingUnit,
  setFundingUnit,
  isLoading,
  lastUpdate,
  pageSize,
  setPageSize,
  favoritesCount,
  PLATFORM_META,
  onlyDiff,
  setOnlyDiff,
  onlyFavs,
  setOnlyFavs,
  minAprPct,
  setMinAprPct,
  minOI,
  setMinOI,
  minVol,
  setMinVol,
  onReset,
  onRefresh
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);

  return (
    <>
    <div className="relative space-y-4 p-1 rounded-lg bg-card shadow-sm">
      {/* Always visible header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            Funding Rate Comparison
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-platform perpetual funding rates</p>
        </div>
        
        {/* Status & Page Size - Desktop Only */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                </div>
                <span className="animate-pulse">Fetching live data...</span>
              </>
            ) : lastUpdate ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span>Connecting...</span>
              </>
            )}
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
            <SelectContent className="bg-gray-900/95 border-gray-700/50 shadow-lg">
              {[10,25,50,100].map(n => (<SelectItem key={n} value={String(n)} className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50">{n} / page</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Controls Section */}
      {isToolbarExpanded && (
      <div className="space-y-4">
        {/* Platform Selection & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(PLATFORM_META).map(p => {
              const active = selectedPlatforms.includes(p.id);
              return (
                <div key={p.id} className="relative platform-selector group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "platform-button relative h-10 w-10 p-0 rounded-full transition-all duration-300 ease-out",
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 hover:shadow-xl hover:shadow-primary/50 hover:scale-115"
                        : "bg-background border-2 border-border hover:border-primary/50 hover:bg-primary/10 shadow-sm opacity-70 hover:opacity-100 hover:scale-105 hover:shadow-lg"
                    )}
                    onClick={() => handlePlatformToggle(p.id)}
                    aria-pressed={active}
                    aria-label={`${active ? 'Deselect' : 'Select'} ${p.name} platform`}
                  >
                    <img 
                      src={p.image || '/placeholder.svg'} 
                      alt={p.name} 
                      className={cn(
                        "rounded-full object-cover transition-all duration-300 ease-out",
                        active 
                          ? "h-8 w-8 brightness-100" 
                          : "h-7 w-7 grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100"
                      )} 
                    />
                  </Button>
                  
                  {/* Active indicator with pulse animation */}
                  {active && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background shadow-lg flex items-center justify-center animate-pulse">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Platform name tooltip */}
                  <div className="platform-tooltip absolute -bottom-10 left-1/2 bg-gray-900/95 border border-gray-700/50 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    <div className="text-white font-semibold tracking-wide">{p.name}</div>
                    <div className="text-xs text-gray-300 mt-1 font-light">
                      {active ? 'Click to remove' : 'Click to add'}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                      <div className="border-4 border-transparent border-b-border"></div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-1 ml-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll} 
                className="text-xs px-3 py-1 h-8 hover:bg-primary hover:text-primary-foreground transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll} 
                className="text-xs px-3 py-1 h-8 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                None
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              placeholder="Search assets..."
              aria-label="Search assets"
              className="pl-10 w-full h-10 bg-background border-border text-foreground"
            />
          </div>
        </div>

        {/* Funding Unit Selection & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Funding Unit Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-accent p-1 border border-border">
            {['1h','8h','1d','1y'].map(u => (
              <Button
                key={u}
                size="sm"
                variant={fundingUnit === u ? 'default' : 'ghost'}
                className={cn('h-9 px-3 rounded-md text-sm font-medium transition-all duration-200',
                  fundingUnit === u 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                )}
                onClick={() => { setFundingUnit(u); }}
              >
                {u}
              </Button>
            ))}
          </div>          {/* Mobile Status & Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isLoading ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Live</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="text-xs px-2">
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs px-2">{favoritesCount}★</Badge>
            
            {/* Desktop Popover Filter */}
            <div className="hidden sm:block">
              <Popover onOpenChange={setShowDesktopFilters}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Open filters" className="text-xs px-3 bg-background border border-border hover:bg-accent">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 max-w-[90vw] bg-gray-900/95 border border-gray-700/50 shadow-2xl backdrop-blur-sm p-0 z-50" align="end" side="bottom">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold tracking-wide text-white">Filter Options</h3>
                    </div>
                    <div className="text-white">
                      <Filters
                        onlyDiff={onlyDiff}
                        setOnlyDiff={setOnlyDiff}
                        onlyFavs={onlyFavs}
                        setOnlyFavs={setOnlyFavs}
                        minAprPct={minAprPct}
                        setMinAprPct={setMinAprPct}
                        minOI={minOI}
                        setMinOI={setMinOI}
                        minVol={minVol}
                        setMinVol={setMinVol}
                        onReset={onReset}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mobile Modal Filter */}
            <div className="block sm:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                aria-label="Open filters" 
                className="text-xs px-3 bg-background border border-border hover:bg-accent"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="hidden lg:flex text-xs px-3">
              <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(minOI || minVol || minAprPct !== '' || onlyFavs) && (
          <div className="flex items-center gap-2 flex-wrap">
            {minOI && (
              <Badge variant="secondary" className="text-xs gap-1 bg-background border border-border">
                OI ≥ {formatNumber(Number(minOI))}
                <button onClick={() => setMinOI('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear OI filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minVol && (
              <Badge variant="secondary" className="text-xs gap-1 bg-background border border-border">
                Vol ≥ {formatNumber(Number(minVol))}
                <button onClick={() => setMinVol('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear volume filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minAprPct !== '' && (
              <Badge variant="secondary" className="text-xs gap-1 bg-background border border-border">
                APR ≥ {minAprPct}%
                <button onClick={() => setMinAprPct('')} className="hover:bg-muted rounded-full p-0.5" aria-label="Clear Min APR">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {onlyFavs && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20">
                Favorites only
              </Badge>
            )}
          </div>
        )}
      </div>
      )}

      {/* Toggle Button - Bottom Right */}
      <button
        onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
        className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-10"
        aria-label={isToolbarExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
      >
        {isToolbarExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    </div>

    {/* Mobile Modal for Filters - Only shows on mobile */}
    {showFilters && (
      <div className="fixed inset-0 z-50 sm:hidden">
        {/* Blurred Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setShowFilters(false)}
        />
        {/* Modal Content - Full Screen on Mobile */}
        <div className="relative bg-gray-900/95 w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/95 sticky top-0 z-10">
            <h2 className="text-lg font-semibold tracking-wide text-white">Filter Options</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Filters Content */}
          <div className="p-4 pb-safe text-white">
            <Filters
              onlyDiff={onlyDiff}
              setOnlyDiff={setOnlyDiff}
              onlyFavs={onlyFavs}
              setOnlyFavs={setOnlyFavs}
              minAprPct={minAprPct}
              setMinAprPct={setMinAprPct}
              minOI={minOI}
              setMinOI={setMinOI}
              minVol={minVol}
              setMinVol={setMinVol}
              onReset={onReset}
            />
          </div>
        </div>
      </div>
    )}

    {/* Desktop Backdrop Blur - Only shows when desktop popover is open */}
    {showDesktopFilters && (
      <div className="fixed inset-0 z-40 hidden sm:block pointer-events-none">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </div>
    )}
    </>
  );
}

// Helper function, assuming it's defined elsewhere, but for now inline
function formatNumber(n) {
  if (!n || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}
