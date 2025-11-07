import { useState, useEffect, useRef, useCallback } from 'react';
import ExtendedWSService from '@/lib/protocols/extended/ws';
import { 
  EXTENDED_WS_CONFIG, 
  EXTENDED_WS_ENDPOINTS, 
  EXTENDED_DATA_TYPES 
} from '@/lib/protocols/extended/extendedTypes.js';

/**
 * Custom hook for Extended WebSocket connections
 * Provides real-time market data from Extended exchange
 */
export function useExtendedWebSocket(market, dataType = EXTENDED_DATA_TYPES.ORDERBOOK_BEST) {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageHistoryRef = useRef([]);
  const currentMarketRef = useRef(market); // Track current market
  const isConnectingRef = useRef(false); // Prevent multiple connections

  // Update current market ref
  useEffect(() => {
    currentMarketRef.current = market;
  }, [market]);

  /**
   * Create WebSocket URL based on data type and market
   */
  const createWebSocketUrl = useCallback(() => {
    const currentMarket = currentMarketRef.current;
    
    if (!currentMarket) {
      throw new Error('No market specified for WebSocket URL creation');
    }
    
    let endpoint;
    let params = {};
    
    switch (dataType) {
      case EXTENDED_DATA_TYPES.ORDERBOOK_BEST:
        endpoint = EXTENDED_WS_ENDPOINTS.ORDERBOOK;
        params.depth = 1;
        break;
      case EXTENDED_DATA_TYPES.ORDERBOOK_FULL:
        endpoint = EXTENDED_WS_ENDPOINTS.ORDERBOOK;
        break;
      case EXTENDED_DATA_TYPES.TRADES:
        endpoint = EXTENDED_WS_ENDPOINTS.TRADES;
        break;
      case EXTENDED_DATA_TYPES.FUNDING:
        endpoint = EXTENDED_WS_ENDPOINTS.FUNDING;
        break;
      default:
        endpoint = EXTENDED_WS_ENDPOINTS.ORDERBOOK;
        params.depth = 1;
    }
    
  return ExtendedWSService.createWebSocketUrl(
      EXTENDED_WS_CONFIG.MAINNET_BASE,
      endpoint,
      currentMarket,
      params
    );
  }, [dataType]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event) => {
    console.log('[useExtendedWebSocket] Raw message received:', event.data);
    
    // Process message using data service
  const processedData = ExtendedWSService.processMessage(event);
    
    if (processedData) {
      // Verify message is for current market to avoid stale data
      const expectedMarket = currentMarketRef.current.includes('-USD') ? 
        currentMarketRef.current : `${currentMarketRef.current}-USD`;
        
      if (processedData.market !== expectedMarket) {
        console.warn('[useExtendedWebSocket] Ignoring stale market data:', {
          received: processedData.market,
          expected: expectedMarket
        });
        return;
      }
      
      // Format for display
  const formattedData = ExtendedWSService.formatForDisplay(processedData);
      
      setMarketData(formattedData);
      setLastMessage({
        timestamp: Date.now(),
        type: processedData.messageType,
        market: processedData.market
      });
      
      // Add to message history
      messageHistoryRef.current = [
        ...messageHistoryRef.current.slice(-EXTENDED_WS_CONFIG.MESSAGE_HISTORY_LIMIT + 1),
        {
          timestamp: Date.now(),
          data: processedData
        }
      ];
      
      console.log('[useExtendedWebSocket] Processed data for market:', expectedMarket, formattedData);
    }
  }, []);

  /**
   * Handle WebSocket connection open
   */
  const handleOpen = useCallback(() => {
    console.log('[useExtendedWebSocket] WebSocket connected for market:', currentMarketRef.current);
    setConnectionState('connected');
    setError(null);
    isConnectingRef.current = false;
  }, []);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((event) => {
    console.error('[useExtendedWebSocket] WebSocket error:', event);
    setError(`WebSocket error: ${event.type}`);
    setConnectionState('error');
    isConnectingRef.current = false;
  }, []);

  /**
   * Handle WebSocket connection close
   */
  const handleClose = useCallback((event) => {
    console.log('[useExtendedWebSocket] WebSocket closed:', event.code, event.reason);
    wsRef.current = null;
    isConnectingRef.current = false;
    
    if (event.code !== 1000) { // Not a normal closure
      setConnectionState('reconnecting');
      
      // Only auto-reconnect if we still have the same market
      reconnectTimeoutRef.current = setTimeout(() => {
        if (currentMarketRef.current && !isConnectingRef.current) {
          console.log('[useExtendedWebSocket] Auto-reconnecting to:', currentMarketRef.current);
          connect();
        }
      }, EXTENDED_WS_CONFIG.RECONNECT_DELAY);
    } else {
      setConnectionState('disconnected');
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    const targetMarket = currentMarketRef.current;
    
    if (!targetMarket) {
      console.warn('[useExtendedWebSocket] No market specified, cannot connect');
      return;
    }

    if (isConnectingRef.current) {
      console.log('[useExtendedWebSocket] Already connecting, ignoring request');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[useExtendedWebSocket] Already connected to:', targetMarket);
      return;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      isConnectingRef.current = true;
      const url = createWebSocketUrl();
      console.log('[useExtendedWebSocket] Connecting to:', url, 'for market:', targetMarket);
      
      setConnectionState('connecting');
      setError(null);
      
      const ws = new WebSocket(url);
      
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('[useExtendedWebSocket] Failed to create WebSocket:', error);
      setError(`Failed to connect: ${error.message}`);
      setConnectionState('error');
      isConnectingRef.current = false;
    }
  }, [createWebSocketUrl, handleOpen, handleMessage, handleClose, handleError]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('[useExtendedWebSocket] Disconnecting WebSocket');
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    isConnectingRef.current = false;
    setConnectionState('disconnected');
    setMarketData(null);
    setError(null);
    messageHistoryRef.current = [];
  }, []);

  /**
   * Reconnect to WebSocket
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Handle market changes - properly disconnect and reconnect
  useEffect(() => {
    console.log('[useExtendedWebSocket] Market changed to:', market);
    
    if (!market) {
      disconnect();
      return;
    }
    
    // Update the current market ref first
    const previousMarket = currentMarketRef.current;
    currentMarketRef.current = market;
    
    // If we're already connected to a different market, disconnect first
    if (wsRef.current?.readyState === WebSocket.OPEN && 
        previousMarket !== market) {
      console.log('[useExtendedWebSocket] Market changed from', previousMarket, 'to', market, '- reconnecting');
      disconnect();
      // Small delay to ensure clean disconnection
      setTimeout(() => {
        if (currentMarketRef.current === market) { // Double-check market hasn't changed again
          connect();
        }
      }, 100);
    } else if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      // No existing connection, just connect
      console.log('[useExtendedWebSocket] No existing connection, connecting to:', market);
      connect();
    }
  }, [market, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isReconnecting: connectionState === 'reconnecting',
    error,
    
    // Market data
    marketData,
    lastMessage,
    messageHistory: messageHistoryRef.current,
    
    // Controls
    connect,
    disconnect,
    reconnect,
    
    // Convenience getters
    bestBid: marketData?.bestBid || null,
    bestAsk: marketData?.bestAsk || null,
    spread: marketData?.spread || null,
    formattedData: marketData?.formatted || null
  };
}
