// DefiLlama API integration for derivatives protocols data
const DEFILLAMA_API_BASE = 'https://api.llama.fi';

export class DefiLlamaAPI {
  // Get all derivatives protocols with volume data
  static async getDerivativesOverview() {
    try {
      const response = await fetch(`${DEFILLAMA_API_BASE}/overview/derivatives`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching derivatives data:', error);
      throw error;
    }
  }

  // Get specific protocol data (when PerpDEX is added)
  static async getProtocolData(protocolSlug) {
    try {
      const response = await fetch(`${DEFILLAMA_API_BASE}/summary/derivatives/${protocolSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${protocolSlug} data:`, error);
      throw error;
    }
  }

  // Search for PerpDEX or similar protocols
  static async searchProtocol(searchTerm) {
    const data = await this.getDerivativesOverview();
    return data.protocols.filter(protocol => 
      protocol.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Format volume numbers for display
  static formatVolume(volume) {
    if (!volume || volume === 0) return '$0';
    
    const trillion = 1e12;
    const billion = 1e9;
    const million = 1e6;
    const thousand = 1e3;
    
    if (volume >= trillion) {
      return `$${(volume / trillion).toFixed(2)}T`;
    } else if (volume >= billion) {
      return `$${(volume / billion).toFixed(2)}B`;
    } else if (volume >= million) {
      return `$${(volume / million).toFixed(2)}M`;
    } else if (volume >= thousand) {
      return `$${(volume / thousand).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  }

  // Get total market data
  static async getTotalMarketData() {
    const data = await this.getDerivativesOverview();
    
    // Use the aggregated data from the API response
    const totalVolume24h = data.total24h || 0;
    const totalVolume7d = data.total7d || 0;
    const change24h = data.change_1d || 0;
    
    return {
      totalVolume24h,
      totalVolume7d,
      change24h,
      protocolCount: data.protocols ? data.protocols.length : 0,
      topProtocols: data.protocols
        ? data.protocols
            .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
            .slice(0, 10)
            .map(protocol => ({
              name: protocol.displayName,
              volume24h: protocol.total24h,
              volume7d: protocol.total7d,
              change24h: protocol.change_1d
            }))
        : []
    };
  }

  // Get all protocols data (not limited to top 10)
  static async getAllProtocolsData() {
    const data = await this.getDerivativesOverview();
    
    // Use the aggregated data from the API response
    const totalVolume24h = data.total24h || 0;
    const totalVolume7d = data.total7d || 0;
    const change24h = data.change_1d || 0;
    
    return {
      totalVolume24h,
      totalVolume7d,
      change24h,
      protocolCount: data.protocols ? data.protocols.length : 0,
      allProtocols: data.protocols
        ? data.protocols
            .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
            .map(protocol => ({
              name: protocol.displayName,
              volume24h: protocol.total24h,
              volume7d: protocol.total7d,
              change24h: protocol.change_1d
            }))
        : []
    };
  }
}

// React hooks for component integration
import { useState, useEffect } from 'react';

export function useDerivativesData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 Starting to fetch derivatives data...');
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        console.log('📡 Calling DefiLlamaAPI.getTotalMarketData()...');
        
        const result = await DefiLlamaAPI.getTotalMarketData();
        console.log('✅ Received data:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ Error fetching derivatives data:', err);
        setError(err);
      } finally {
        setLoading(false);
        console.log('🏁 Finished loading derivatives data');
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

// Hook for searching protocols
export function useProtocolSearch(searchTerm) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setSearching(true);
      try {
        const protocols = await DefiLlamaAPI.searchProtocol(searchTerm);
        setResults(protocols);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return { results, searching };
}