// Next.js API route to proxy Aster Finance API calls
// This bypasses CORS issues by making server-side requests

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const symbol = searchParams.get('symbol');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit') || '1000';
    const interval = searchParams.get('interval');
    
    if (!endpoint) {
      return Response.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }
    
    let url = `https://fapi.asterdex.com/fapi/v1/${endpoint}`;
    
    // Build query parameters based on endpoint
    const params = new URLSearchParams();
    
    if (endpoint === 'fundingRate') {
      if (symbol) params.append('symbol', symbol);
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);
      params.append('limit', limit);
    } else if (endpoint === 'premiumIndex') {
      if (symbol) params.append('symbol', symbol);
    } else if (endpoint === 'time') {
      // No parameters needed for time endpoint
    } else if (endpoint === 'exchangeInfo') {
      // No parameters needed for exchangeInfo endpoint
    } else if (endpoint === 'ticker/24hr') {
      if (symbol) params.append('symbol', symbol);
    } else if (endpoint === 'depth') {
      if (symbol) params.append('symbol', symbol);
      if (limit) params.append('limit', limit);
    } else if (endpoint === 'klines') {
      if (symbol) params.append('symbol', symbol);
      if (interval) params.append('interval', interval);
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);
      params.append('limit', limit);
    } else if (endpoint === 'openInterest') {
      if (symbol) params.append('symbol', symbol);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('Proxying request to:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aster API error:', response.status, errorText);
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
