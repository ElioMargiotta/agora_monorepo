// Custom hook for WebSocket market data streaming
import { useEffect, useRef, useState } from 'react';

export const useMarketDataStream = (market, enabled = true, owner = null) => {
  const [marketData, setMarketData] = useState({
    market: market || 'SUI-USD',
    mark_price: null,
    funding_rate: null,
    volume_24h: null,
    best_bid: null,
    best_ask: null,
    open_interest: null,
    last_updated: null,
    last_price: null,
    connected: false,
    error: null
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = () => {
    console.log('WebSocket connect called with:', { enabled, market, owner });

    if (!enabled || !market || !owner) {
      console.warn('WebSocket connection disabled or missing parameters:', { enabled, market, owner });
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log(`Connecting to WebSocket for market: ${market}, owner: ${owner}`);

      // Connect to our backend WebSocket endpoint which handles official Extended exchange streams
      const wsUrl = `ws://localhost:8000/extended/trading/stream/market-data/${market}?owner=${encodeURIComponent(owner)}`;
      console.log('WebSocket URL:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected for market: ${market}`);
        setMarketData(prev => ({ ...prev, connected: true, error: null }));
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            console.error('WebSocket error:', data.error);
            setMarketData(prev => ({ ...prev, error: data.error }));
            return;
          }

          // Update market data with real-time data from Extended exchange
          setMarketData(prev => ({
            ...prev,
            ...data,
            connected: true,
            error: null
          }));

        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket closed for market: ${market}`, event.code, event.reason);
        setMarketData(prev => ({ ...prev, connected: false }));

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error for market: ${market}:`, error);
        setMarketData(prev => ({
          ...prev,
          connected: false,
          error: 'WebSocket connection error'
        }));
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setMarketData(prev => ({
        ...prev,
        connected: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    if (enabled && market && owner) {
      connect();
    } else {
      // Disconnect if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setMarketData(prev => ({ ...prev, connected: false }));
    }

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled, market, owner]);

  // Send ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, []);

  // Format data for display
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return typeof price === 'number' ? price.toFixed(6) : price;
  };

  const formatPercentage = (rate) => {
    if (rate === null || rate === undefined) return 'N/A';
    const percentage = typeof rate === 'number' ? (rate * 100).toFixed(4) : rate;
    return `${percentage}%`;
  };

  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return 'N/A';
    if (typeof volume === 'number') {
      if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(2)}M`;
      } else if (volume >= 1000) {
        return `${(volume / 1000).toFixed(2)}K`;
      }
      return volume.toFixed(2);
    }
    return volume;
  };

  return {
    ...marketData,
    formatPrice,
    formatPercentage,
    formatVolume,
    reconnect: connect
  };
};
