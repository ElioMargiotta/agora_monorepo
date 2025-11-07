'use client';

import { useState, useEffect, useCallback } from 'react';
import { asterDataService } from '@/lib/protocols/aster';

/**
 * Hook for fetching Aster Finance funding rates for all markets
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsterFunding = (refreshInterval = 0) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Get all trading symbols first
      const markets = await asterDataService.getAllMarkets();

      // Fetch funding rates for all symbols in parallel (prioritize major coins)
      const majorCoins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT'];
      const prioritizedMarkets = [
        ...majorCoins.filter(coin => markets.includes(coin)),
        ...markets.filter(coin => !majorCoins.includes(coin))
      ];

      console.log('🔍 Aster markets available:', markets.length);
      console.log('🎯 Prioritized markets (first 10):', prioritizedMarkets.slice(0, 10));
      console.log('📊 BTCUSDT in markets:', markets.includes('BTCUSDT'));

      // Try bulk fetching first
      let bulkFundingRates = {};
      let bulkMarketData = {};
      try {
        console.log('🚀 Attempting bulk fetch for Aster data...');
        [bulkFundingRates, bulkMarketData] = await Promise.all([
          asterDataService.getAllFundingRates(),
          asterDataService.getAllMarketData()
        ]);
        console.log('✅ Bulk fetch successful:', Object.keys(bulkFundingRates).length, 'funding rates,', Object.keys(bulkMarketData).length, 'market data');
      } catch (bulkError) {
        console.warn('❌ Bulk fetch failed, falling back to individual calls:', bulkError.message);
        bulkFundingRates = {};
        bulkMarketData = {};
      }

      // If bulk fetch worked and has data, use it; otherwise fall back to individual calls
      let validData = [];
      if (Object.keys(bulkFundingRates).length > 0 && Object.keys(bulkMarketData).length > 0) {
        // Use bulk data - combine funding rates with market data
        prioritizedMarkets.slice(0, 100).forEach(symbol => {
          const asset = symbol.replace('USDT', '');
          const fundingRate = bulkFundingRates[asset];
          const marketData = bulkMarketData[asset];

          if (fundingRate !== undefined && marketData) {
            validData.push({
              asset,
              coin: asset,
              fundingRate: fundingRate,
              predictedFundingRate: fundingRate,
              dailyFundingRate: fundingRate * 3,
              volume24h: marketData.quoteVolume || 0,
              openInterest: marketData.openInterest || 0,
              markPx: marketData.price || 0, // Using lastPrice as markPx approximation
              nextFundingTime: Date.now() + 8 * 60 * 60 * 1000, // Default
            });
          }
        });
      } else {
        // Fall back to individual calls
        const fundingPromises = prioritizedMarkets.slice(0, 100).map(async (symbol) => {
          try {
            const fundingRate = await asterDataService.fundingRate(symbol);
            const asset = symbol.replace('USDT', '');
            const marketData = bulkMarketData[asset] || await asterDataService.marketData(symbol);

            if (symbol === 'BTCUSDT') {
              console.log('🐄 BTCUSDT funding rate:', fundingRate);
              console.log('🐄 BTCUSDT market data:', marketData ? 'available' : 'null');
            }

            if (fundingRate !== null && marketData) {
              return {
                asset: symbol.replace('USDT', ''),
                coin: symbol.replace('USDT', ''),
                fundingRate: fundingRate,
                predictedFundingRate: fundingRate, // Aster doesn't provide separate predicted rate
                dailyFundingRate: fundingRate * 3, // Approximate daily rate
                nextFundingTime: marketData.nextFundingTime || Date.now() + 8 * 60 * 60 * 1000,
                volume24h: marketData.quoteVolume || 0,
                openInterest: marketData.openInterest || 0,
                markPx: marketData.markPrice || 0
              };
            }
            return null;
          } catch (err) {
            // Skip symbols that don't have funding data
            return null;
          }
        });

        const fundingResults = await Promise.all(fundingPromises);
        validData = fundingResults.filter(item => item !== null);
      }

      console.log('🎯 Aster funding data fetched:', validData.length, 'valid items');
      const btcData = validData.find(item => item.asset === 'BTC');
      if (btcData) {
        console.log('🐄 BTC data from Aster hook:', btcData);
      } else {
        console.log('❌ No BTC data found in Aster results');
      }

      // Fetch OI for all assets
      const oiPromises = validData.map(async (item) => {
        try {
          const oi = await asterDataService.openInterest(item.asset);
          return { asset: item.asset, oi };
        } catch (err) {
          return { asset: item.asset, oi: 0 };
        }
      });

      const oiResults = await Promise.all(oiPromises);
      const oiMap = {};
      oiResults.forEach(({ asset, oi }) => {
        oiMap[asset] = oi;
      });

      // Update validData with OI
      validData = validData.map(item => ({
        ...item,
        openInterest: oiMap[item.asset] || item.openInterest
      }));

      setData(validData);
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
