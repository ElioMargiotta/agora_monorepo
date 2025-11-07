'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';

export default function APIConnectionTest({ onStatusUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/aster?endpoint=exchangeInfo');
      const data = await response.json();
      
      if (response.ok && data.symbols && data.symbols.length > 0) {
        const status = `✅ Connected - ${data.symbols.length} markets available`;
        onStatusUpdate?.(status);
        setLastCheck(new Date());
      } else {
        const status = '❌ Connection failed - No data received';
        onStatusUpdate?.(status);
      }
    } catch (error) {
      const status = `❌ Connection failed - ${error.message}`;
      onStatusUpdate?.(status);
    }
    setIsLoading(false);
  };

  // Auto-test on mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={testConnection}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="h-8"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Testing...
          </div>
        ) : (
          'Test API'
        )}
      </Button>
      {lastCheck && (
        <span className="text-xs text-gray-500">
          Last checked: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
