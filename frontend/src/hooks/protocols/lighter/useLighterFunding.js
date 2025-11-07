'use client';
import { useEffect, useState } from 'react';
import { fetchLighterFunding } from '@/lib/protocols/lighter';

export function useLighterFunding() {
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const arr = await fetchLighterFunding();
      // Normalize to generic per-hour fields used in grouping:
      const normalized = arr.map((it) => ({
        asset: it.symbol,               // e.g. BTCUSDT, BTC-PERP, etc.
        fundingRate: it.fundingRatePerHour, // per hour fraction
        openInterest: it.openInterestUsd ?? 0,
        volume24h: it.volume24hUsd ?? 0,
        markPx: null, // TODO if available
      }));
      setData(normalized);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial load only
  }, []);

  return { data, loading, error, lastUpdate, refetch: fetchData };
}
