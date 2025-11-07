// Next.js API Route - Hyperliquid Proxy
// Consolidated route handling all Hyperliquid API endpoints
// This route acts as a proxy to avoid CORS issues

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const coin = searchParams.get('coin');
    const nSigFigs = searchParams.get('nSigFigs') || '3';
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!type) {
      return Response.json({ error: 'Missing type parameter' }, { status: 400 });
    }

    let url = `https://api.hyperliquid.xyz/info`;
    let body = { type };

    // Build request body based on type
    if (type === 'allMids') {
      // No additional parameters needed
    } else if (type === 'meta') {
      // No additional parameters needed
    } else if (type === 'metaAndAssetCtxs') {
      // No additional parameters needed
    } else if (type === 'l2Book') {
      if (!coin) {
        return Response.json({ error: 'Missing coin parameter for l2Book' }, { status: 400 });
      }
      body.coin = coin;
      body.nSigFigs = parseInt(nSigFigs);
    } else if (type === 'recentTrades') {
      if (!coin) {
        return Response.json({ error: 'Missing coin parameter for recentTrades' }, { status: 400 });
      }
      body.coin = coin;
    } else if (type === 'fundingHistory') {
      if (!coin) {
        return Response.json({ error: 'Missing coin parameter for fundingHistory' }, { status: 400 });
      }
      if (!startTime || !endTime) {
        return Response.json({ error: 'Missing startTime or endTime for fundingHistory' }, { status: 400 });
      }
      body.coin = coin;
      body.startTime = parseInt(startTime) * 1000; // Convert to milliseconds
      body.endTime = parseInt(endTime) * 1000;
    } else {
      return Response.json(
        {
          error: 'Unsupported type parameter',
          supportedTypes: ['allMids', 'meta', 'metaAndAssetCtxs', 'l2Book', 'recentTrades', 'fundingHistory']
        },
        { status: 400 }
      );
    }

    console.log('🔍 Hyperliquid API request:', {
      type,
      coin,
      nSigFigs,
      startTime,
      endTime
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Aequilibra-Frontend/1.0'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hyperliquid API error:', response.status, errorText);
      return Response.json({
        error: `API error: ${response.status} - ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({
      error: 'Internal proxy error',
      details: error.message
    }, { status: 500 });
  }
}
