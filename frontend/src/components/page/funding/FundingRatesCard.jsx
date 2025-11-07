import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FundingTable from './FundingTable';

export default function FundingRatesCard({
  filteredSorted,
  page,
  setPage,
  pageSize,
  totalPages,
  minAprPct,
  minOI,
  minVol,
  pageItems,
  selectedPlatforms,
  PLATFORM_META,
  fundingUnit,
  favorites,
  toggleFavorite,
  handleViewAsset,
  formatPct,
  formatNumber,
  rateColor,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) {
  return (
    <Card className="border-0 shadow-lg bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-end justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Funding Rates</CardTitle>
            <div className="text-xs text-muted-foreground">{filteredSorted.length} assets • page {page} / {totalPages}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">APR ≥ {minAprPct || 0}%</Badge>
            {(minOI !== '' || minVol !== '') && (
              <Badge variant="secondary" className="text-[11px] rounded-full">
                Row kept if ≥1 passes; arbitrage viable if ≥2
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <FundingTable
          rows={pageItems}
          selectedPlatforms={selectedPlatforms}
          PLATFORM_META={PLATFORM_META}
          fundingUnit={fundingUnit}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          handleViewAsset={handleViewAsset}
          formatPct={formatPct}
          formatNumber={formatNumber}
          rateColor={rateColor}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={filteredSorted.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      </CardContent>
    </Card>
  );
}
