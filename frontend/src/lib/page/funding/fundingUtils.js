import { asterDataService } from '@/lib/protocols/aster';

// Cache for Aster funding intervals to avoid repeated API calls
export const asterIntervalCache = new Map();

export async function getAsterFundingInterval(symbol) {
  const cacheKey = symbol;
  if (asterIntervalCache.has(cacheKey)) return asterIntervalCache.get(cacheKey);

  // Try localStorage cache first
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    if (stored && stored[cacheKey]) {
      asterIntervalCache.set(cacheKey, stored[cacheKey]);
      return stored[cacheKey];
    }
  } catch {}

  // Helper: timeout a promise
  const withTimeout = (p, ms = 5000) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);

  try {
    // Ask only for the last 2 events (enough to get cadence)
    const historyData = await withTimeout(
      asterDataService.fundingRateHistory(symbol, null, null, 2),
      5000
    );

    if (historyData?.length >= 2) {
      const t0 = historyData[0].fundingTime;
      const t1 = historyData[1].fundingTime;
      const intervalMs = Math.abs(t1 - t0);
      const hours = Math.max(1, Math.round(intervalMs / (1000 * 60 * 60)));

      const result = { hours, milliseconds: intervalMs };
      asterIntervalCache.set(cacheKey, result);

      // persist in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
        stored[cacheKey] = result;
        localStorage.setItem('funding:asterIntervals', JSON.stringify(stored));
      } catch {}

      return result;
    }
  } catch (error) {
    console.warn(`Aster interval ${symbol} failed:`, error);
  }

  // Fallback: 4h
  const fallback = { hours: 4, milliseconds: 4 * 60 * 60 * 1000 };
  asterIntervalCache.set(cacheKey, fallback);
  try {
    const stored = JSON.parse(localStorage.getItem('funding:asterIntervals') || '{}');
    stored[cacheKey] = fallback;
    localStorage.setItem('funding:asterIntervals', JSON.stringify(stored));
  } catch {}
  return fallback;
}

export function nextFundingTime(unit) {
  const now = Date.now();
  const ms = unit === 'per_8h' ? 8 * 60 * 60 * 1000 : unit === 'per_hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return new Date(now + ms);
}

export function normalizeAssetName(assetName) {
  if (!assetName) return '';
  return assetName
    .trim()
    .toUpperCase()
    .replace(/[-_/](PERP|SWAP)$/i, '')
    .replace(/[-_/]?(USD|USDT|USDC|BUSD)$/i, '')
    .replace(/\s+PERP$/i, '')
    .replace(/:\w+$/i, '')
    .replace(/[^A-Z0-9.]/g, '');
}

export function formatPct(rate, digits = 4) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return 'N/A';
  const v = Number(rate) * 100;
  const s = v.toFixed(digits);
  return `${v >= 0 ? '+' : ''}${s}%`;
}

export function formatNumber(n) {
  if (!n || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

export function rateColor(rate) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) return 'text-slate-400 dark:text-slate-500';
  return Number(rate) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

export function isFiniteNum(x) { return typeof x === 'number' && isFinite(x); }

// If OI/Vol are already USD, just return Number(x) or 0.
export function toUsd(x) {
  const n = Number(x);
  return isFinite(n) ? n : 0;
}
