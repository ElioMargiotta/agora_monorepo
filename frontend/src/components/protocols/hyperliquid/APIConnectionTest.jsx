'use client';

import { useState } from 'react';

const APIConnectionTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (endpoint, params = {}) => {
    setLoading(true);
    const testId = `${endpoint}_${Date.now()}`;

    try {
      const queryParams = new URLSearchParams({
        type: endpoint,
        ...params
      });

      const startTime = Date.now();
      const response = await fetch(`/api/hyperliquid?${queryParams}`);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            endpoint,
            params,
            status: 'error',
            responseTime,
            error: errorData.error || `HTTP ${response.status}`,
            timestamp: new Date().toISOString()
          }
        }));
      } else {
        const data = await response.json();
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            endpoint,
            params,
            status: 'success',
            responseTime,
            dataSize: JSON.stringify(data).length,
            timestamp: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          endpoint,
          params,
          status: 'error',
          responseTime: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testEndpoints = [
    { name: 'All Mids', endpoint: 'allMids', description: 'Get all trading pair prices' },
    { name: 'Meta', endpoint: 'meta', description: 'Get exchange metadata' },
    { name: 'Meta & Asset Contexts', endpoint: 'metaAndAssetCtxs', description: 'Get metadata with funding rates' },
    { name: 'BTC Orderbook', endpoint: 'l2Book', params: { coin: 'BTC', nSigFigs: '3' }, description: 'Get BTC orderbook' },
    { name: 'BTC Recent Trades', endpoint: 'recentTrades', params: { coin: 'BTC' }, description: 'Get recent BTC trades' },
  ];

  return (
    <div className="space-y-6">
      {/* Test Buttons */}
      <div className="bg-background border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">API Connection Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testEndpoints.map((test, index) => (
            <button
              key={index}
              onClick={() => runTest(test.endpoint, test.params)}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {test.name}
            </button>
          ))}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          Click any button to test the corresponding API endpoint
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-background border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-3">
            {Object.entries(testResults)
              .sort(([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(([testId, result]) => (
                <div
                  key={testId}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-medium">{result.endpoint}</span>
                      {result.params && Object.keys(result.params).length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({Object.entries(result.params).map(([k, v]) => `${k}=${v}`).join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.responseTime}ms
                    </div>
                  </div>

                  {result.status === 'success' ? (
                    <div className="text-sm text-green-700 dark:text-green-400">
                      ✓ Success - {result.dataSize} bytes received
                    </div>
                  ) : (
                    <div className="text-sm text-red-700 dark:text-red-400">
                      ✗ Error: {result.error}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-muted-foreground">Testing API connection...</span>
        </div>
      )}
    </div>
  );
};

export default APIConnectionTest;
