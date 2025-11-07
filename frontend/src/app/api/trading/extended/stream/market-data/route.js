// API route for WebSocket streaming market data
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || 'SUI-USD';
  
  // Return WebSocket connection info
  return Response.json({
    websocket_url: `ws://localhost:8000/extended/trading/stream/market-data/${market}`,
    market: market,
    data_types: ['mark_price', 'funding_rate', 'volume_24h', 'best_bid', 'best_ask', 'open_interest'],
    connection_type: 'websocket'
  });
}
