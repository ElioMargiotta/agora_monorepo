// Next.js API Route - Lighter Proxy
// Proxy for Lighter API to avoid CORS issues

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Extract the path after /api/lighter/
    const lighterIndex = pathSegments.indexOf('lighter');
    const subPath = pathSegments.slice(lighterIndex + 1).join('/');

    if (subPath === 'funding-rates') {
      // Proxy to Lighter funding rates
      const response = await fetch('https://mainnet.zklighter.elliot.ai/api/v1/funding-rates', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return Response.json(
          { error: `Lighter API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return Response.json(data);
    } else {
      return Response.json(
        { error: 'Endpoint not found', availableEndpoints: ['/funding-rates'] },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Lighter API proxy error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
