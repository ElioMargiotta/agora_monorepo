'use client';

import { useState, useEffect, useCallback } from 'react';
import { hyperliquidDataService } from '@/lib/protocols/hyperliquid';

/**
 * Hook for fetching Hyperliquid market data with auto-refresh
 * @param {string} symbol - Trading symbol (e.g., 'BTC/USD' or 'BTC')
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHyperliquidMarketData = (symbol, refreshInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setError(null);
      const marketData = await hyperliquidDataService.getMarketData(symbol);
      setData(marketData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for fetching Hyperliquid orderbook data
 * @param {string} coin - Coin symbol (e.g., 'BTC')
 * @param {number} nSigFigs - Number of significant figures
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHyperliquidOrderbook = (coin, nSigFigs = 3, refreshInterval = 10000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!coin) return;

    try {
      setError(null);
      const orderbookData = await hyperliquidDataService.getOrderbook(coin, nSigFigs);
      setData(orderbookData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coin, nSigFigs]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for fetching Hyperliquid funding rates
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHyperliquidFunding = (refreshInterval = 0) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const fundingData = await hyperliquidDataService.getFundingRates();
      setData(fundingData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
};

export const useHyperliquidMarkets = (refreshInterval = 30000) => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setError(null);
      const marketList = await hyperliquidDataService.getAllMarkets();
      setMarkets(marketList);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();

    // Set up periodic updates
    const interval = setInterval(fetchMarkets, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMarkets, refreshInterval]);

  return {
    data: markets,
    loading,
    error,
    lastUpdate,
    refetch: fetchMarkets
  };
};

/**
 * Hook for fetching Hyperliquid recent trades
 * @param {string} coin - Coin symbol (e.g., 'BTC')
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHyperliquidTrades = (coin, refreshInterval = 10000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!coin) return;

    try {
      setError(null);
      const tradesData = await hyperliquidDataService.getRecentTrades(coin);
      setData(tradesData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coin]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook for fetching Hyperliquid funding history
 * @param {string} coin - Coin symbol (e.g., 'BTC')
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHyperliquidFundingHistory = (coin, startTime, endTime) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!coin || !startTime || !endTime) return;

    try {
      setError(null);
      const historyData = await hyperliquidDataService.getFundingHistory(coin, startTime, endTime);
      setData(historyData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coin, startTime, endTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
