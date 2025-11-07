'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';

// Hooks
import { useHyperliquidFunding } from '@/hooks/protocols/hyperliquid';
import { useExtendedFunding } from '@/lib/protocols/extended/rest';
import { useAsterFunding } from '@/hooks/protocols/aster/useAsterFunding';
import { useLighterFunding } from '@/hooks/protocols/lighter/useLighterFunding';
import { useParadexFunding } from '@/hooks/protocols/paradex/useParadexFunding';

import { PLATFORM_META, AVAILABLE_PLATFORMS } from '@/lib/page/funding/fundingConstants';
import {
  asterIntervalCache,
  getAsterFundingInterval,
  nextFundingTime,
  normalizeAssetName,
  formatPct,
  formatNumber,
  rateColor,
  isFiniteNum,
  toUsd,
} from '@/lib/page/funding/fundingUtils';

import Toolbar from '@/components/page/funding/Toolbar';
import BackgroundShapes from '@/components/page/funding/BackgroundShapes';
import LoadingCard from '@/components/page/funding/LoadingCard';
import ErrorCard from '@/components/page/funding/ErrorCard';
import NoSelectionCard from '@/components/page/funding/NoSelectionCard';
import FundingRatesCard from '@/components/page/funding/FundingRatesCard';

// — Page wrapper —
export default function FundingComparisonPage() {
  return (
    <div className="min-h-screen bg-background">
      <FundingComparison />
    </div>
  );
}

export function FundingComparison() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(AVAILABLE_PLATFORMS.map(p => p.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('maxRate'); // 'asset' | 'maxRate' | 'spread' | 'volume' | 'oi'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [onlyDiff, setOnlyDiff] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdate, setLastUpdate] = useState(null);

  // New filter states (UI only for now)
  const [minOI, setMinOI] = useState('');
  const [minVol, setMinVol] = useState('');

  // Funding unit state
  const [fundingUnit, setFundingUnit] = useState('1h'); // '1h' | '8h' | '1d' | '1y'
  const FUNDING_MULT = { '1h': 1, '8h': 8, '1d': 24, '1y': 24 * 365 };
  const scaleFunding = (perHour) => {
    if (perHour == null || isNaN(Number(perHour))) return null;
    return Number(perHour) * FUNDING_MULT[fundingUnit];
  };

  // Min APR filter state
  const [minAprPct, setMinAprPct] = useState('');

  // Router for navigation
  const router = useRouter();

  // Handler to navigate to asset page
  const handleViewAsset = (assetName) => {
    router.push(`/markets/asset/${assetName.toLowerCase()}`);
  };

  // Aster funding intervals (dynamically calculated per symbol)
  const [asterIntervals, setAsterIntervals] = useState(new Map());

  // Favorites state with localStorage persistence
  const [favorites, setFavorites] = useState(new Set());

  // Load favorites from localStorage on client
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('funding:favorites') || '[]');
      setFavorites(new Set(stored));
    } catch {}
  }, []);
  const [onlyFavs, setOnlyFavs] = useState(false);

  // Data hooks
  const hyperliquidData = useHyperliquidFunding();
  const extendedData = useExtendedFunding();
  const asterData = useAsterFunding();
  const lighterData = useLighterFunding();
  const paradexData = useParadexFunding();

  // Refresh handler
  const handleRefresh = async () => {
    const refreshPromises = [];
    
    if (selectedPlatforms.includes('hyperliquid') && hyperliquidData.refetch) {
      refreshPromises.push(hyperliquidData.refetch());
    }
    if (selectedPlatforms.includes('extended') && extendedData.refetch) {
      refreshPromises.push(extendedData.refetch());
    }
    if (selectedPlatforms.includes('aster') && asterData.refetch) {
      refreshPromises.push(asterData.refetch());
    }
    if (selectedPlatforms.includes('lighter') && lighterData.refetch) {
      refreshPromises.push(lighterData.refetch());
    }
    if (selectedPlatforms.includes('paradex') && paradexData.refetch) {
      refreshPromises.push(paradexData.refetch());
    }
    
    await Promise.all(refreshPromises);
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => prev.includes(platformId)
      ? prev.filter(id => id !== platformId)
      : [...prev, platformId]);
    setPage(1);
  };

  const handleSelectAll = () => setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
  const handleClearAll = () => setSelectedPlatforms([]);

  // Favorites persistence
  useEffect(() => {
    localStorage.setItem('funding:favorites', JSON.stringify([...favorites]));
  }, [favorites]);

// Fetch Aster funding intervals progressively with bounded concurrency
useEffect(() => {
  if (!(selectedPlatforms.includes('aster') && asterData.data?.length)) return;

  let cancelled = false;

  const symbols = asterData.data
    .map((item) => (item.asset ?? item.coin ?? '').toString())
    .filter(Boolean);

  // Seed from localStorage immediately (avoids refetch on reload)
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    if (stored && typeof stored === 'object') {
      // Merge into state Map
      setAsterIntervals(new Map(Object.entries(stored)));
      // Also prime in-memory cache
      Object.entries(stored).forEach(([k, v]) => asterIntervalCache.set(k, v));
    }
  } catch {}

  // Helper to push each discovered interval into state + storage
  const pushInterval = (sym, interval) => {
    if (cancelled) return;
    setAsterIntervals((prev) => {
      const next = new Map(prev);
      next.set(sym, interval);
      try {
        const obj = Object.fromEntries(next);
        localStorage.setItem('funding:asterIntervals', JSON.stringify(obj));
      } catch {}
      return next;
    });
  };

  // Bounded concurrency (simple worker pool)
  const CONCURRENCY = 6;
  let i = 0;

  const worker = async () => {
    while (!cancelled && i < symbols.length) {
      const sym = symbols[i++];
      // Use memory cache if available
      if (asterIntervalCache.has(sym)) {
        pushInterval(sym, asterIntervalCache.get(sym));
        continue;
      }
      try {
        const res = await getAsterFundingInterval(sym);
        pushInterval(sym, res);
      } catch {
        pushInterval(sym, { hours: 4, milliseconds: 4 * 60 * 60 * 1000 });
      }
    }
  };

  // Kick off workers (fire-and-forget; don't await)
  const workers = Array.from({ length: Math.min(CONCURRENCY, symbols.length) }, worker);

  return () => { cancelled = true; };
}, [selectedPlatforms, asterData.data]);

  // Helper to toggle favorite
  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      return next;
    });
  };

  // Combine
  const combined = useMemo(() => {
    const rows = [];

    function pushFrom(list, platformKey) {
      if (!list) return;
      const meta = PLATFORM_META[platformKey];
      list.forEach((item) => {
        const asset = (item.asset ?? item.coin ?? '').toString();
        const normalized = normalizeAssetName(asset);
        let rateNum = item.fundingRate !== undefined && item.fundingRate !== null && !isNaN(Number(item.fundingRate))
          ? Number(item.fundingRate)
          : null;
        if (platformKey === 'aster' && rateNum !== null) {
          // Convert from per-interval to per hour using dynamic interval calculation
          const interval = asterIntervals.get(asset) || { hours: 4 }; // fallback to 4 hours
          rateNum /= interval.hours;
        }
        if (platformKey === 'paradex' && rateNum !== null) {
          // Convert from funding period rate (in decimals) to per hour
          const periodHours = item.fundingPeriodHours || 8;
          rateNum /= periodHours;
        }
        rows.push({
          platform: platformKey,
          platformName: meta.name,
          unit: meta.unit,
          asset,
          normalized,
          fundingRate: rateNum,
          nextFunding: nextFundingTime(meta.unit),
          volume24h: toUsd(item.volume24h),        // ensure number
          openInterest: platformKey === 'aster' ? toUsd(item.openInterest) * toUsd(item.markPx) : toUsd(item.openInterestUSD || item.openInterest),
          markPx: Number(item.markPx ?? 0),
        });
      });
    }

    if (selectedPlatforms.includes('hyperliquid')) pushFrom(hyperliquidData.data, 'hyperliquid');
    if (selectedPlatforms.includes('extended')) pushFrom(extendedData.data, 'extended');
    if (selectedPlatforms.includes('aster')) pushFrom(asterData.data, 'aster');
    if (selectedPlatforms.includes('lighter')) pushFrom(lighterData.data, 'lighter');
    if (selectedPlatforms.includes('paradex')) pushFrom(paradexData.data, 'paradex');

    return rows;
  }, [selectedPlatforms, hyperliquidData.data, extendedData.data, asterData.data, asterIntervals, lighterData.data, paradexData.data]);

  // Group by asset
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of combined) {
      if (!r.normalized) continue;
      if (!map.has(r.normalized)) {
        map.set(r.normalized, {
          asset: r.normalized,
          platforms: {},
          volume24h: 0,
          openInterest: 0,
          maxRate: null,
          minRate: null,
          spread: null,
        });
      }
      const g = map.get(r.normalized);
      g.platforms[r.platform] = {
        fundingRate: r.fundingRate,
        platformName: r.platformName,
        openInterest: r.openInterest,
        volume24h: r.volume24h,
        validOI:  isFiniteNum(r.openInterest)  && r.openInterest  >= 0,
        validVol: isFiniteNum(r.volume24h) && r.volume24h >= 0,
      };
      g.volume24h = Math.max(g.volume24h, r.volume24h || 0);
      g.openInterest = Math.max(g.openInterest, r.openInterest || 0);

      if (r.fundingRate !== null) {
        g.maxRate = g.maxRate === null ? r.fundingRate : Math.max(g.maxRate, r.fundingRate);
        g.minRate = g.minRate === null ? r.fundingRate : Math.min(g.minRate, r.fundingRate);
      }
    }

    const out = Array.from(map.values()).map(g => {
      const entries = Object.entries(g.platforms);
      const perHourVals = entries
        .map(([k, v]) => ({ key: k, val: v.fundingRate }))
        .filter(({ val }) => val != null);

      if (perHourVals.length >= 2) {
        const mx = perHourVals.reduce((a, b) => (b.val > a.val ? b : a));
        const mn = perHourVals.reduce((a, b) => (b.val < a.val ? b : a));
        const spreadPerHour = mx.val - mn.val;
        const apr = spreadPerHour * 24 * 365;

        g.maxRate = mx.val;
        g.minRate = mn.val;
        g.apr = apr;
        g.shortPlatform = mx.key;
        g.longPlatform = mn.key;
        return g;
      }
      return { ...g, spread: null, apr: null, longPlatform: null, shortPlatform: null };
    });

    return out.filter(g => Object.values(g.platforms).filter(p => p.fundingRate !== null).length >= 2);
  }, [combined]);

  // Debug validation
  console.debug('row check', grouped.map(g => [g.asset, Object.fromEntries(Object.entries(g.platforms).map(([k,v]) => [k, { OI:v.openInterest, Vol:v.volume24h, okOI:v.validOI, okVol:v.validVol }]))]));

  // Filter + sort
  const filteredSorted = useMemo(() => {
    let arr = grouped.filter(g => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return g.asset.toLowerCase().includes(q);
    });

    if (onlyDiff) arr = arr.filter(g => (g.apr ?? 0) > 0);

    if (onlyFavs) arr = arr.filter(g => favorites.has(g.asset));

    if (minAprPct !== '') {
      const thr = Number(minAprPct);
      if (!isNaN(thr) && thr >= 0) {
        arr = arr.filter(g => (g.apr ?? 0) * 100 >= thr);
      }
    }

    const thrOI  = minOI  === '' ? null : Number(minOI);
    const thrVol = minVol === '' ? null : Number(minVol);

    if (thrOI !== null || thrVol !== null) {
      arr = arr.map(g => {
        // Platforms present in this row & currently selected
        const toCheck = selectedPlatforms.filter(p => g.platforms[p]);

        // Count platforms that pass BOTH thresholds (when set)
        const passes = toCheck.filter(pid => {
          const p = g.platforms[pid];
          const okOI  = thrOI  === null ? true : (p?.validOI  && p.openInterest >= thrOI);
          const okVol = thrVol === null ? true : (p?.validVol && p.volume24h  >= thrVol);
          return okOI && okVol;
        }).length;

        // annotate for UI (used later)
        g._passCount = passes;
        g._checkedCount = toCheck.length;
        g._meetsTwoForArb = passes >= 2;  // arbitrage viability flag
        return g;
      })
      // Keep the row visible if AT LEAST ONE platform passes
      .filter(g => (g._passCount ?? 0) >= 1);
    } else {
      // No thresholds set — still compute flags for UI consistency
      arr = arr.map(g => {
        const toCheck = selectedPlatforms.filter(p => g.platforms[p]);
        g._checkedCount = toCheck.length;
        g._passCount = toCheck.length;     // treat as all passing when no thresholds
        g._meetsTwoForArb = g._passCount >= 2;
        return g;
      });
    }

    const dir = sortOrder === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = sortBy === 'asset' ? a.asset : (a.maxRate ?? Number.NEGATIVE_INFINITY);
      const bv = sortBy === 'asset' ? b.asset : (b.maxRate ?? Number.NEGATIVE_INFINITY);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    });

    return arr;
  }, [grouped, searchQuery, onlyDiff, onlyFavs, minAprPct, minOI, minVol, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  // Update last update timestamp from hooks
  useEffect(() => {
    const times = [];
    if (hyperliquidData.lastUpdate) times.push(hyperliquidData.lastUpdate);
    if (extendedData.lastUpdate) times.push(extendedData.lastUpdate);
    if (asterData.lastUpdate) times.push(asterData.lastUpdate);
    if (lighterData.lastUpdate) times.push(lighterData.lastUpdate);
    if (paradexData.lastUpdate) times.push(paradexData.lastUpdate);
    if (times.length) setLastUpdate(new Date(Math.max(...times.map(t => t.getTime()))));
  }, [hyperliquidData.lastUpdate, extendedData.lastUpdate, asterData.lastUpdate, lighterData.lastUpdate, paradexData.lastUpdate]);

  const isLoading = (
    (selectedPlatforms.includes('hyperliquid') && hyperliquidData.loading) ||
    (selectedPlatforms.includes('extended') && extendedData.loading) ||
    (selectedPlatforms.includes('aster') && asterData.loading) ||
    (selectedPlatforms.includes('lighter') && lighterData.loading) ||
    (selectedPlatforms.includes('paradex') && paradexData.loading)
  );

  const hasError = (
    (selectedPlatforms.includes('hyperliquid') && !!hyperliquidData.error) ||
    (selectedPlatforms.includes('extended') && !!extendedData.error) ||
    (selectedPlatforms.includes('aster') && !!asterData.error) ||
    (selectedPlatforms.includes('lighter') && !!lighterData.error) ||
    (selectedPlatforms.includes('paradex') && !!paradexData.error)
  );

  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <BackgroundShapes />
        {/* Header */}
        <div className="border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <Toolbar
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              handlePlatformToggle={handlePlatformToggle}
              handleSelectAll={handleSelectAll}
              handleClearAll={handleClearAll}
              query={searchQuery}
              setQuery={(v) => { setSearchQuery(v); setPage(1); }}
              fundingUnit={fundingUnit}
              setFundingUnit={setFundingUnit}
              isLoading={isLoading}
              lastUpdate={lastUpdate}
              pageSize={pageSize}
              setPageSize={(v) => { setPageSize(Number(v)); setPage(1); }}
              favoritesCount={favorites.size}
              PLATFORM_META={PLATFORM_META}
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
              onReset={() => { setOnlyDiff(true); setOnlyFavs(false); setMinAprPct(''); setMinOI(''); setMinVol(''); }}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Main */}
            <div>
              {/* Loading */}
              {isLoading && <LoadingCard />}

              {/* Errors */}
              {hasError && (
                <ErrorCard
                  selectedPlatforms={selectedPlatforms}
                  hyperliquidData={hyperliquidData}
                  extendedData={extendedData}
                  asterData={asterData}
                  lighterData={lighterData}
                  paradexData={paradexData}
                />
              )}

              {/* No selection */}
              {selectedPlatforms.length === 0 && !isLoading && !hasError && <NoSelectionCard />}

              {/* Table */}
              {!isLoading && !hasError && selectedPlatforms.length > 0 && (
                <FundingRatesCard
                  filteredSorted={filteredSorted}
                  page={page}
                  setPage={setPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  minAprPct={minAprPct}
                  minOI={minOI}
                  minVol={minVol}
                  pageItems={pageItems}
                  selectedPlatforms={selectedPlatforms}
                  PLATFORM_META={PLATFORM_META}
                  fundingUnit={fundingUnit}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  handleViewAsset={handleViewAsset}
                  formatPct={formatPct}
                  formatNumber={formatNumber}
                  rateColor={rateColor}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
