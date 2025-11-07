import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PlatformHeaderCell from './PlatformHeaderCell';
import PlatformRateCell from './PlatformRateCell';
import StrategyCell from './StrategyCell';
import PaginationBar from './PaginationBar';

export default function FundingTable({
  rows,
  selectedPlatforms,
  PLATFORM_META,
  fundingUnit,
  favorites,
  toggleFavorite,
  handleViewAsset,
  formatPct,
  formatNumber,
  rateColor,
  page,
  setPage,
  pageSize,
  totalPages,
  totalItems,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) {
  const FUNDING_MULT = { '1h': 1, '8h': 8, '1d': 24, '1y': 24 * 365 };
  const scaleFunding = (perHour) => {
    if (perHour == null || isNaN(Number(perHour))) return null;
    return Number(perHour) * FUNDING_MULT[fundingUnit];
  };

  return (
    <div>
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {rows.map((g) => {
          const scaledVals = selectedPlatforms
            .filter(k => g.platforms[k]?.fundingRate != null)
            .map(k => scaleFunding(g.platforms[k].fundingRate));
          const rowMax = scaledVals.length ? Math.max(...scaledVals) : null;
          const rowMin = scaledVals.length ? Math.min(...scaledVals) : null;
          const aprPercent = g.apr ? (g.apr * 100).toFixed(1) : '0.0';
          
          return (
            <Card key={g.asset} className="p-3 border border-border/50">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(g.asset)}
                      className="p-1 rounded hover:bg-muted/40 transition-colors"
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        favorites.has(g.asset) ? "text-amber-500/70 fill-current" : "text-muted-foreground/60"
                      )}/>
                    </button>
                    <span className="font-semibold text-base text-foreground/90">{g.asset}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground">
                    {aprPercent}% APR
                  </Badge>
                </div>

                {/* Platform Rates */}
                <div className="space-y-2">
                  {selectedPlatforms.map(platformId => {
                    const platform = g.platforms[platformId];
                    if (!platform) return null;
                    
                    const v = scaleFunding(platform.fundingRate ?? null);
                    const isShort = platformId === g.shortPlatform;
                    const isLong = platformId === g.longPlatform;
                    
                    return (
                      <div key={platformId} className="flex items-center justify-between p-2 bg-muted/10 rounded border border-border/30">
                        <div className="flex items-center gap-2">
                          <img 
                            src={PLATFORM_META[platformId]?.image || '/placeholder.svg'} 
                            alt={PLATFORM_META[platformId]?.name} 
                            className="h-4 w-4 rounded-full opacity-80"
                          />
                          <span className="text-xs font-medium text-foreground/80">{PLATFORM_META[platformId]?.name}</span>
                          {isShort && <span className="text-xs font-medium text-red-600">SHORT</span>}
                          {isLong && <span className="text-xs font-medium text-green-600">LONG</span>}
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-medium text-foreground/85">
                            {formatPct(v)}
                          </div>
                          <div className="text-xs text-muted-foreground/70">
                            OI: {formatNumber(platform.openInterest)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs"
                  onClick={() => handleViewAsset(g.asset)}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View {g.asset}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ minWidth: '200px' }} />
            {selectedPlatforms.map(() => <col style={{ minWidth: '120px' }} />)}
            <col style={{ minWidth: '80px' }} />
            <col style={{ minWidth: '200px' }} />
          </colgroup>
          <thead>
            <tr className="border-b bg-muted/30">
              <th 
                className="text-left p-4 font-semibold sticky left-0 bg-muted/30 z-10 cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortBy === 'asset') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('asset');
                    setSortOrder('asc');
                  }
                }}
              >
                Asset
            </th>
            {selectedPlatforms.map(platformId => (
              <th key={platformId} className="text-center p-4 font-semibold">
                <PlatformHeaderCell platformId={platformId} meta={PLATFORM_META[platformId]} suffix={` · ${fundingUnit}`} />
              </th>
            ))}
            <th 
              className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/50"
              onClick={() => {
                if (sortBy === 'maxRate') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('maxRate');
                  setSortOrder('desc');
                }
              }}
            >
              APR
            </th>
            <th className="text-center p-4 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => {
            const scaledVals = selectedPlatforms
              .filter(k => g.platforms[k]?.fundingRate != null)
              .map(k => scaleFunding(g.platforms[k].fundingRate));
            const rowMax = scaledVals.length ? Math.max(...scaledVals) : null;
            const rowMin = scaledVals.length ? Math.min(...scaledVals) : null;
            return (
              <tr key={g.asset} className="hover:bg-muted/30 transition-all duration-200 border-b border-border h-[56px]">
                <td className="p-4 sticky left-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Toggle favorite for ${g.asset}`}
                      aria-pressed={favorites.has(g.asset)}
                      onClick={() => toggleFavorite(g.asset)}
                      className="p-1 rounded hover:bg-muted/40 transition-colors"
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        favorites.has(g.asset) ? "text-amber-400 fill-current" : "text-muted-foreground"
                      )}/>
                    </button>
                    <span className="font-semibold text-foreground text-sm block truncate max-w-[12ch] md:max-w-[18ch]" title={g.asset}>{g.asset}</span>
                  </div>
                </td>
                {selectedPlatforms.map(platformId => {
                  const v = scaleFunding(g.platforms[platformId]?.fundingRate ?? null);
                  return (
                    <td key={platformId} className="p-4 text-center">
                      {g.platforms[platformId] ? (
                        <PlatformRateCell
                          valuePerUnit={v}
                          isRowMax={v === rowMax}
                          isRowMin={v === rowMin}
                          oiUsd={g.platforms[platformId].openInterest}
                          volUsd={g.platforms[platformId].volume24h}
                          formatPct={formatPct}
                          formatNumber={formatNumber}
                          rateColor={rateColor}
                        />
                      ) : <div className="text-muted-foreground text-sm font-mono">—</div>}
                    </td>
                  );
                })}
                <td className="p-4 text-center font-semibold text-emerald-500">
                  {g.apr != null ? `${(g.apr * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleViewAsset(g.asset)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <StrategyCell longPlatform={g.longPlatform} shortPlatform={g.shortPlatform} meta={PLATFORM_META} />
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {g._passCount}/{g._checkedCount} pass{g._passCount === 1 ? '' : 'es'}
                    {!g._meetsTwoForArb && (
                      <span className="ml-1 text-amber-400">need ≥2 for arb</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No matching assets</p>
          <p className="text-xs mt-1">Try broadening your search or lowering the bps threshold</p>
        </div>
      )}
      {rows.length > 0 && (
        <PaginationBar page={page} setPage={setPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} />
      )}
      </div>
    </div>
  );
}
