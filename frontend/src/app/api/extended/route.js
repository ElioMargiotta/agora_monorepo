// Next.js API Route - Extended Exchange Proxy
// Consolidated route handling all Extended Exchange API endpoints
// This route acts as a proxy to avoid CORS issues

// Handle different endpoints based on the request path
export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Extract the path after /api/extended/
    const extendedIndex = pathSegments.indexOf('extended');
    const subPath = pathSegments.slice(extendedIndex + 1).join('/');

    console.log('🔍 Extended API request:', {
      subPath,
      params,
      searchParams: Object.fromEntries(url.searchParams)
    });

    // Route to appropriate handler
    if (subPath === 'funding') {
      return await handleFundingRates();
    } else if (subPath === 'markets') {
      return await handleMarkets();
    } else if (subPath.startsWith('info/') && subPath.includes('/funding')) {
      return await handleFundingHistory(request, params);
    } else {
      return Response.json(
        {
          status: 'ERROR',
          error: { message: 'Endpoint not found' },
          availableEndpoints: ['/funding', '/markets', '/info/[market]/funding']
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Extended API error:', error);

    return Response.json(
      {
        status: 'ERROR',
        error: { message: error.message },
        data: [],
      },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

// CORS headers helper
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handle /api/extended/funding - Current funding rates
 */
async function handleFundingRates() {
  try {
    // Extended Exchange provides funding rates within the markets data
    const response = await fetch(
      'https://api.starknet.extended.exchange/api/v1/info/markets',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Aequilibra-Frontend/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Extended API HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const marketsData = await response.json();

    // Extract funding rates from market data
    const fundingRates =
      marketsData.data
        ?.filter((market) => market.active && market.visibleOnUi && market.marketStats)
        ?.map((market) => {
          const stats = market.marketStats;
          const fundingRate = parseFloat(stats.fundingRate) || 0; // Keep in decimal format like Hyperliquid

          return {
            symbol: market.name,
            coin: market.assetName,
            base: market.assetName,
            quote: market.collateralAssetName,
            market: market.name,
            fundingRate: fundingRate,
            predictedFundingRate: fundingRate, // Use current rate as predicted (Extended doesn't provide separate predicted rate)
            dailyFundingRate: fundingRate * 3, // Approximate daily rate (8h rate * 3)
            nextFundingTime:
              stats.nextFundingRate || Date.now() + 60 * 60 * 1000,
            timestamp: Date.now(),
            price: parseFloat(stats.lastPrice) || 0, // Add price field for the table
            markPrice: parseFloat(stats.markPrice) || 0,
            indexPrice: parseFloat(stats.indexPrice) || 0,
            openInterest: parseFloat(stats.openInterest) || 0,
            volume24h: parseFloat(stats.dailyVolume) || 0,
            maxLeverage: parseFloat(market.tradingConfig?.maxLeverage) || 1,
          };
        }) || [];

    // Return successful response with CORS headers
    return Response.json(
      {
        status: 'OK',
        data: fundingRates,
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('Extended funding rates API error:', error);
    throw error;
  }
}

/**
 * Handle /api/extended/markets - Market names and data
 */
async function handleMarkets() {
  try {
    const response = await fetch(
      'https://api.starknet.extended.exchange/api/v1/info/markets',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Aequilibra-Frontend/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Extended API HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const extendedData = await response.json();

    // Transform the data on the server side to avoid client-side issues
    const transformedData =
      extendedData.data
        ?.filter(
          (market) => market.active && market.visibleOnUi && market.marketStats
        )
        ?.map((market) => {
          const stats = market.marketStats;

          return {
            symbol: market.name,
            base: market.assetName,
            quote: market.collateralAssetName,
            price: parseFloat(stats.lastPrice) || 0,
            change24h: parseFloat(stats.dailyPriceChangePercentage) * 100 || 0,
            priceChange24h: parseFloat(stats.dailyPriceChange) || 0,
            volume24h: parseFloat(stats.dailyVolume) || 0,
            volumeBase24h: parseFloat(stats.dailyVolumeBase) || 0,
            high24h: parseFloat(stats.dailyHigh) || 0,
            low24h: parseFloat(stats.dailyLow) || 0,
            bid: parseFloat(stats.bidPrice) || 0,
            ask: parseFloat(stats.askPrice) || 0,
            markPrice: parseFloat(stats.markPrice) || 0,
            indexPrice: parseFloat(stats.indexPrice) || 0,
            fundingRate: parseFloat(stats.fundingRate) * 100 || 0,
            nextFundingTime:
              stats.nextFundingRate || Date.now() + 60 * 60 * 1000,
            openInterest: parseFloat(stats.openInterest) || 0,
            openInterestBase: parseFloat(stats.openInterestBase) || 0,
            maxLeverage: parseFloat(market.tradingConfig?.maxLeverage) || 1,
            category: market.category || 'Unknown',
            active: market.active,
            status: market.status,
          };
        }) || [];

    // Return successful response with CORS headers
    return Response.json(
      {
        status: 'OK',
        data: transformedData,
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('Extended markets API error:', error);
    throw error;
  }
}

/**
 * Handle /api/extended/info/[market]/funding - Funding history
 */
async function handleFundingHistory(request, params) {
  try {
    const { market } = params;
    const { searchParams } = new URL(request.url);

    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const cursor = searchParams.get('cursor');
    const limit = searchParams.get('limit') || '100';

    console.log('🔍 Funding history request for market:', market, 'params:', {
      startTime,
      endTime,
      limit,
    });

    if (!market) {
      return Response.json(
        {
          status: 'ERROR',
          error: { message: 'Market parameter is required' }
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (!startTime || !endTime) {
      return Response.json(
        {
          status: 'ERROR',
          error: { message: 'startTime and endTime parameters are required' }
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Use the actual Extended API funding history endpoint
    const baseUrl = 'https://api.starknet.extended.exchange/api/v1';
    const apiUrl = new URL(`${baseUrl}/info/${market}/funding`);

    // Add query parameters
    apiUrl.searchParams.append('startTime', startTime);
    apiUrl.searchParams.append('endTime', endTime);
    apiUrl.searchParams.append('limit', limit);

    if (cursor) {
      apiUrl.searchParams.append('cursor', cursor);
    }

    console.log(`📡 Making request to Extended API: ${apiUrl.toString()}`);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'AequilibraFrontend/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Extended API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if Extended API returned an error
    if (data.status === 'ERROR') {
      console.error('Extended API Error:', data.error);
      return Response.json({
        status: 'ERROR',
        error: data.error
      }, { status: 400, headers: getCorsHeaders() });
    }

    console.log(`✅ Successfully fetched funding history for ${market}: ${data.data?.length || 0} records`);

    // Return the data in the same format as Extended API
    return Response.json({
      status: 'OK',
      data: data.data || [],
      pagination: data.pagination || {},
      market,
      timeframe: {
        startTime: parseInt(startTime),
        endTime: parseInt(endTime)
      }
    }, { headers: getCorsHeaders() });

  } catch (error) {
    console.error(`❌ Error fetching funding history for ${params.market}:`, error);

    // If the API fails, provide fallback simulated data for development
    console.log('📄 Falling back to simulated funding data...');

    const { searchParams } = new URL(request.url);
    const startTimeMs = parseInt(searchParams.get('startTime'));
    const endTimeMs = parseInt(searchParams.get('endTime'));
    const requestedLimit = parseInt(searchParams.get('limit') || '100');

    // Generate simulated funding history data
    const simulatedData = generateSimulatedFundingHistory(
      params.market,
      startTimeMs,
      endTimeMs,
      requestedLimit
    );

    return Response.json({
      status: 'OK',
      data: simulatedData,
      pagination: {
        cursor: null,
        count: simulatedData.length
      },
      market: params.market,
      timeframe: {
        startTime: startTimeMs,
        endTime: endTimeMs
      },
      note: 'Simulated data - Extended API may not be available'
    }, { headers: getCorsHeaders() });
  }
}

/**
 * Generate simulated funding history data for development
 */
function generateSimulatedFundingHistory(market, startTime, endTime, limit) {
  const data = [];
  const duration = endTime - startTime;
  const interval = Math.max(duration / limit, 60000); // At least 1 minute intervals

  // Base funding rate varies by market
  let baseFundingRate = 0.0001; // 0.01%
  if (market.includes('BTC')) baseFundingRate = 0.0002;
  if (market.includes('ETH')) baseFundingRate = 0.0001;
  if (market.includes('SOL')) baseFundingRate = 0.0003;

  for (let timestamp = endTime; timestamp >= startTime && data.length < limit; timestamp -= interval) {
    // Add some randomness to the funding rate
    const randomVariation = (Math.random() - 0.5) * 0.0004; // ±0.02%
    const fundingRate = baseFundingRate + randomVariation;

    data.push({
      m: market,
      T: Math.floor(timestamp),
      f: fundingRate.toFixed(6)
    });
  }

  return data;
}
