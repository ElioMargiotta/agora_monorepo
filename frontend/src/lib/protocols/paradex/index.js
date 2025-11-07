const BASE_URL = '/api/paradex';

export async function fetchParadexFunding() {
  try {
    // First, get all markets
    const marketsRes = await fetch(`${BASE_URL}/markets`);
    if (!marketsRes.ok) throw new Error('Failed to fetch Paradex markets');
    const marketsData = await marketsRes.json();

    // Filter for perpetual markets
    const perpMarkets = marketsData.results.filter(m => m.asset_kind === 'PERP');

    // For each perp market, fetch the summary
    const summaryPromises = perpMarkets.map(async (market) => {
      try {
        const summaryRes = await fetch(`${BASE_URL}/markets/summary?market=${market.symbol}`);
        if (!summaryRes.ok) return null;
        const summaryData = await summaryRes.json();
        if (!summaryData.results || summaryData.results.length === 0) return null;
        const summary = summaryData.results[0];
        return {
          asset: market.symbol.replace('-USD-PERP', '').replace('-PERP', ''),
          coin: market.symbol.replace('-USD-PERP', '').replace('-PERP', ''),
          fundingRate: parseFloat(summary.funding_rate) || null,
          volume24h: parseFloat(summary.volume_24h) || null,
          openInterestUSD: parseFloat(summary.open_interest) * parseFloat(summary.underlying_price) || null,
          markPx: parseFloat(summary.mark_price) || null,
          fundingPeriodHours: market.funding_period_hours || 8,
          underlying_price: parseFloat(summary.underlying_price) || null,
          bid: parseFloat(summary.bid) || null,
          ask: parseFloat(summary.ask) || null,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(summaryPromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error('Error fetching Paradex funding:', error);
    return [];
  }
}
