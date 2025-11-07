// Debug API Route - Hyperliquid Data Inspector
// This route shows exactly what data Hyperliquid API returns

// Don't import the file with React hooks, instead call the API directly
// import { HyperliquidAPI } from '@/lib/hyperliquidAPI';

const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.xyz';

// Server-side Hyperliquid API functions (without React hooks)
class ServerHyperliquidAPI {
  // Get funding rates for perpetual contracts
  static async getFundingRates() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format funding rates from asset contexts
      const [meta, assetCtxs] = data;
      const fundingRates = [];

      if (meta && meta.universe && assetCtxs) {
        meta.universe.forEach((asset, index) => {
          const assetCtx = assetCtxs[index];
          if (assetCtx && assetCtx.funding !== undefined) {
            fundingRates.push({
              coin: asset.name,
              fundingRate: assetCtx.funding,
              markPx: assetCtx.markPx,
              openInterest: assetCtx.openInterest,
            });
          }
        });
      }

      return fundingRates;
    } catch (error) {
      console.error('Error fetching Hyperliquid funding rates:', error);
      throw error;
    }
  }

  // Get historical funding rates for a specific asset
  static async getFundingHistory(coin, startTime, endTime) {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'fundingHistory',
          coin,
          startTime: startTime * 1000, // Convert to milliseconds
          endTime: endTime * 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match our expected format
      return data.map((entry) => ({
        timestamp: Math.floor(entry.time / 1000), // Convert back to seconds
        fundingRate: entry.fundingRate,
        coin: coin,
      }));
    } catch (error) {
      console.error(`Error fetching funding history for ${coin}:`, error);
      throw error;
    }
  }

  // Get meta information about available assets
  static async getMeta() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid meta:', error);
      throw error;
    }
  }

  // Get all trading pairs with market data
  static async getAllMids() {
    try {
      const response = await fetch(`${HYPERLIQUID_API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'allMids',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid mids:', error);
      throw error;
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'BTC';
    const action = searchParams.get('action') || 'all';

    const debugData = {
      timestamp: new Date().toISOString(),
      requestedAsset: asset,
      requestedAction: action,
      data: {},
    };

    console.log('Debug Hyperliquid API request:', { asset, action });

    // Test different Hyperliquid API endpoints
    if (action === 'all' || action === 'funding') {
      try {
        console.log('Fetching funding rates...');
        const fundingRates = await ServerHyperliquidAPI.getFundingRates();
        debugData.data.fundingRates = {
          success: true,
          count: fundingRates?.length || 0,
          data: fundingRates,
          assetData: fundingRates?.find(rate => rate.coin === asset),
        };
        console.log('Funding rates fetched:', fundingRates?.length, 'items');
      } catch (error) {
        debugData.data.fundingRates = {
          success: false,
          error: error.message,
        };
        console.error('Funding rates error:', error);
      }
    }

    if (action === 'all' || action === 'history') {
      try {
        console.log('Fetching funding history...');
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 7 * 24 * 60 * 60; // 7 days ago
        
        const history = await ServerHyperliquidAPI.getFundingHistory(asset, startTime, endTime);
        debugData.data.fundingHistory = {
          success: true,
          count: history?.length || 0,
          timeRange: {
            startTime,
            endTime,
            startDate: new Date(startTime * 1000).toISOString(),
            endDate: new Date(endTime * 1000).toISOString(),
          },
          data: history,
          samplePoints: history?.slice(0, 5), // First 5 points
          lastPoints: history?.slice(-5), // Last 5 points
        };
        console.log('Funding history fetched:', history?.length, 'items');
      } catch (error) {
        debugData.data.fundingHistory = {
          success: false,
          error: error.message,
        };
        console.error('Funding history error:', error);
      }
    }

    if (action === 'all' || action === 'meta') {
      try {
        console.log('Fetching meta data...');
        const meta = await ServerHyperliquidAPI.getMeta();
        debugData.data.meta = {
          success: true,
          data: meta,
          availableAssets: meta?.universe?.map(asset => asset.name) || [],
        };
        console.log('Meta data fetched');
      } catch (error) {
        debugData.data.meta = {
          success: false,
          error: error.message,
        };
        console.error('Meta data error:', error);
      }
    }

    if (action === 'all' || action === 'mids') {
      try {
        console.log('Fetching mids data...');
        const mids = await ServerHyperliquidAPI.getAllMids();
        debugData.data.mids = {
          success: true,
          data: mids,
          assetPrice: mids?.[asset],
        };
        console.log('Mids data fetched');
      } catch (error) {
        debugData.data.mids = {
          success: false,
          error: error.message,
        };
        console.error('Mids data error:', error);
      }
    }

    // Add summary
    debugData.summary = {
      totalAPICalls: Object.keys(debugData.data).length,
      successfulCalls: Object.values(debugData.data).filter(d => d.success).length,
      failedCalls: Object.values(debugData.data).filter(d => !d.success).length,
      notes: [
        `Requested asset: ${asset}`,
        `Debug action: ${action}`,
        `Timestamp: ${debugData.timestamp}`,
        'Use ?asset=ETH&action=funding to test specific asset funding rates',
        'Use ?asset=BTC&action=history to test funding history',
        'Use ?action=meta to see all available assets',
      ],
    };

    return Response.json(debugData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return Response.json(
      {
        error: 'Debug API failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
