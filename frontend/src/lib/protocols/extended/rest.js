// REST helpers and simple React hooks for Extended protocol (moved from src/lib/extendedAPI.js)

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const EXTENDED_BASE_URL = '/api/extended';

const extendedRequest = async (endpoint, options = {}) => {
  const url = `${EXTENDED_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `Extended API HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data && data.status === 'ERROR') {
      throw new Error(
        `Extended API Error: ${data.error?.message || 'Unknown error'}`
      );
    }

    return data;
  } catch (error) {
    console.error(`Extended API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const getExtendedMarkets = async () => {
  try {
    const response = await extendedRequest('/markets');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Extended markets:', error);
    throw error;
  }
};

export const getExtendedMarketNames = async () => {
  try {
    const markets = await getExtendedMarkets();
    return markets.map(m => m.symbol).filter(Boolean).sort();
  } catch (error) {
    console.error('Error fetching Extended market names:', error);
    throw error;
  }
};

export const getExtendedMarketStats = async (market) => {
  try {
    const markets = await getExtendedMarkets();
    const marketData = markets.find((m) => m.name === market || m.symbol === market);
    return marketData?.marketStats || null;
  } catch (error) {
    console.error(`Error fetching Extended market stats for ${market}:`, error);
    throw error;
  }
};

export const getExtendedFundingRates = async () => {
  try {
    const response = await extendedRequest('/funding');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching Extended funding rates:', error);
    throw error;
  }
};

export const getExtendedFundingHistory = async (market, startTime, endTime) => {
  try {
    const response = await extendedRequest(
      `/info/${market}/funding?startTime=${startTime}&endTime=${endTime}&limit=100`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching funding history for ${market}:`, error);
    throw error;
  }
};

/**
 * React hook for fetching market names with loading and error states
 */
export const useExtendedMarketNames = () => {
  const [marketNames, setMarketNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketNames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const names = await getExtendedMarketNames();
      setMarketNames(names);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketNames();
  }, [fetchMarketNames]);

  return { marketNames, loading, error, refetch: fetchMarketNames };
};

/**
 * React hook for fetching full market objects
 */
export const useExtendedMarkets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const mountedRef = useRef(true);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const markets = await getExtendedMarkets();
      if (mountedRef.current) {
        setData(markets);
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchMarkets]);

  return useMemo(() => ({ data, loading, error, lastUpdate, refetch: fetchMarkets }), [data, loading, error, lastUpdate, fetchMarkets]);
};

/**
 * React hook for fetching funding rate list
 */
export const useExtendedFunding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const mountedRef = useRef(true);

  const fetchFunding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rates, markets] = await Promise.all([
        getExtendedFundingRates(),
        getExtendedMarkets()
      ]);
      // Combine funding rates with market data for volume
      const combinedRates = rates.map(rate => {
        const market = markets.find(m => m.name === rate.market || m.symbol === rate.symbol);
        return {
          ...rate,
          volume24h: market?.volume24h || rate.volume24h || 0,
          openInterest: market?.openInterest || rate.openInterest || 0,
        };
      });
      if (mountedRef.current) {
        setData(combinedRates);
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchFunding();
    // No automatic refresh - only manual refresh via refetch
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFunding]);

  return useMemo(() => ({ data, loading, error, lastUpdate, refetch: fetchFunding }), [data, loading, error, lastUpdate, fetchFunding]);
};

export default {
  getExtendedMarkets,
  getExtendedMarketNames,
  getExtendedMarketStats,
  getExtendedFundingRates,
  getExtendedFundingHistory,
  useExtendedMarketNames,
  useExtendedMarkets,
  useExtendedFunding
};
