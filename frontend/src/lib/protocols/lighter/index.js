const BASE = 'https://mainnet.zklighter.elliot.ai/api/v1';

/**
 * Fetch market details including volume and OI for all markets
 */
async function fetchLighterMarketDetails() {
  try {
    const res = await fetch('/api/lighter/orderBookDetails');
    if (!res.ok) return new Map();
    const data = await res.json();
    if (data.code !== 200 || !data.order_book_details) return new Map();
    const detailsMap = new Map();
    data.order_book_details.forEach(detail => {
      detailsMap.set(detail.symbol, {
        volume24h: detail.daily_quote_token_volume,
        openInterest: detail.open_interest,
      });
    });
    return detailsMap;
  } catch {
    return new Map();
  }
}

/**
 * Return array of { symbol, fundingRatePerHour, openInterestUsd|null, volume24hUsd|null }
 * fundingRatePerHour: fraction per hour (e.g. 0.0001 == 1 bps/h)
 */
export async function fetchLighterFunding() {
  const [fundingRes, detailsMap] = await Promise.all([
    fetch('/api/lighter/funding-rates'),
    fetchLighterMarketDetails()
  ]);

  if (!fundingRes.ok) throw new Error(`lighter funding-rates ${fundingRes.status}`);
  const data = await fundingRes.json();

  // Response: { code: 200, funding_rates: [{ market_id, exchange, symbol, rate }, ...] }
  // Filter for exchange === 'lighter'
  const lighterRates = (data.funding_rates || []).filter(item => item.exchange === 'lighter');

  return lighterRates.map((d) => {
    const details = detailsMap.get(d.symbol);
    return {
      symbol: d.symbol ?? '',
      fundingRatePerHour: Number(d.rate ?? 0) / 8,  // Lighter API returns 8h funding rate, divide by 8 for 1h
      openInterestUsd: details?.openInterest || null,
      volume24hUsd: details?.volume24h || null,
      // keep raw for future
      _raw: d,
    };
  });
}
