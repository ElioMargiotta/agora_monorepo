'use client';

import { useState, useEffect } from 'react';
import { getProtocolService, getEnabledProtocols } from '@/lib/protocols';

/**
 * Generic hook for protocol data fetching
 * @param {string} protocolId - Protocol identifier
 * @param {string} method - Method to call on the protocol service
 * @param {Array} args - Arguments to pass to the method
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useProtocolData = (protocolId, method, args = [], refreshInterval = 0) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const service = getProtocolService(protocolId);
      
      if (!service || !service[method]) {
        throw new Error(`Method ${method} not found for protocol ${protocolId}`);
      }

      const result = await service[method](...args);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [protocolId, method, JSON.stringify(args), refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook to get available protocols
 * @returns {Object} { protocols, enabledProtocols }
 */
export const useProtocols = () => {
  const [protocols] = useState(() => getEnabledProtocols());
  const enabledProtocols = protocols.filter(p => p.enabled);

  return {
    protocols,
    enabledProtocols
  };
};

/**
 * Hook for multi-protocol comparison
 * @param {Array} protocolIds - Array of protocol IDs to compare
 * @param {string} method - Method to call on each protocol
 * @param {Array} args - Arguments to pass to each method
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useMultiProtocolData = (protocolIds, method, args = [], refreshInterval = 0) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const results = {};

      await Promise.all(
        protocolIds.map(async (protocolId) => {
          try {
            const service = getProtocolService(protocolId);
            if (service && service[method]) {
              results[protocolId] = await service[method](...args);
            }
          } catch (err) {
            results[protocolId] = { error: err.message };
          }
        })
      );

      setData(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [JSON.stringify(protocolIds), method, JSON.stringify(args), refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
