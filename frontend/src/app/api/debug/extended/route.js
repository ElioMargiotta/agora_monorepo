// Debug API Route - Extended Exchange Data Inspector
// This route shows exactly what data Extended Exchange API returns

// Import only the server-side functions, not the React hooks
// import { getExtendedMarkets, getExtendedFundingHistory } from '@/lib/extendedAPI';

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

    console.log('Debug Extended API request:', { asset, action });

    // Test Extended Exchange API endpoints by calling them directly
    if (action === 'all' || action === 'markets') {
      try {
        console.log('Fetching Extended markets...');
        const response = await fetch(`${request.url.split('/api/debug')[0]}/api/extended/markets`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const markets = await response.json();
          debugData.data.markets = {
            success: true,
            count: markets.data?.length || 0,
            data: markets.data,
            assetData: markets.data?.find(market => 
              market.name === asset || 
              market.assetName === asset ||
              market.name?.toLowerCase() === asset.toLowerCase() ||
              market.assetName?.toLowerCase() === asset.toLowerCase()
            ),
          };
        } else {
          debugData.data.markets = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        console.log('Extended markets fetched');
      } catch (error) {
        debugData.data.markets = {
          success: false,
          error: error.message,
        };
        console.error('Extended markets error:', error);
      }
    }

    if (action === 'all' || action === 'history') {
      try {
        console.log('Fetching Extended funding history...');
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 7 * 24 * 60 * 60; // 7 days ago
        
        const response = await fetch(`${request.url.split('/api/debug')[0]}/api/extended/info/${asset}/funding?startTime=${startTime}&endTime=${endTime}&limit=50`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const history = await response.json();
          debugData.data.fundingHistory = {
            success: true,
            count: history.data?.length || 0,
            timeRange: {
              startTime,
              endTime,
              startDate: new Date(startTime * 1000).toISOString(),
              endDate: new Date(endTime * 1000).toISOString(),
            },
            data: history.data,
            samplePoints: history.data?.slice(0, 5), // First 5 points
            lastPoints: history.data?.slice(-5), // Last 5 points
          };
        } else {
          debugData.data.fundingHistory = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        console.log('Extended funding history fetched');
      } catch (error) {
        debugData.data.fundingHistory = {
          success: false,
          error: error.message,
        };
        console.error('Extended funding history error:', error);
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
        'Use ?asset=ETH&action=markets to test specific asset markets',
        'Use ?asset=BTC&action=history to test funding history',
        'Use ?action=api-route to test the actual API route used by the frontend',
      ],
    };

    return Response.json(debugData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Debug Extended API error:', error);
    return Response.json(
      {
        error: 'Debug Extended API failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
