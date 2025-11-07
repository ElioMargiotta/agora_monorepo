/**
 * Standardized APY calculation functions for delta neutral strategies
 * This ensures consistent calculations across all components
 */

/**
 * Calculate delta neutral APY based on funding rate differential
 * @param {number} hyperliquidRate - Hyperliquid funding rate (decimal form, e.g., 0.0001 = 0.01%)
 * @param {number} extendedRate - Extended Exchange funding rate (decimal form, e.g., 0.0001 = 0.01%)
 * @param {string} period - 'hours', 'days', or 'year'
 * @returns {number} APY as percentage
 */
export const calculateDeltaNeutralAPY = (
  hyperliquidRate,
  extendedRate,
  period = 'year'
) => {
  // Both rates are now in decimal form
  const hlRateDecimal = hyperliquidRate;
  const exRateDecimal = extendedRate;

  // Calculate absolute difference
  const rateDifferential = Math.abs(hlRateDecimal - exRateDecimal);

  // If no meaningful difference, return 0
  if (rateDifferential < 0.000001) return 0; // Less than 0.0001%

  switch (period) {
    case 'hours':
      // Return 8-hour rate as percentage
      return rateDifferential * 100;

    case 'days':
      // 3 funding periods per day (every 8 hours)
      // For delta neutral, we capture spread 3 times per day
      return rateDifferential * 3 * 100;

    case 'year':
      // For delta neutral strategies, we capture the spread 3 times per day
      // More realistic to use simple interest: rate * periods per year
      // 3 periods per day * 365 days = 1095 periods per year
      return rateDifferential * 1095 * 100;

    default:
      return rateDifferential * 100;
  }
};

/**
 * Get funding rate differential in basis points
 * @param {number} hyperliquidRate - Hyperliquid funding rate (decimal)
 * @param {number} extendedRate - Extended funding rate (decimal)
 * @returns {number} Difference in basis points
 */
export const getFundingDifferentialBPS = (hyperliquidRate, extendedRate) => {
  const hlRateDecimal = hyperliquidRate;
  const exRateDecimal = extendedRate;
  return (exRateDecimal - hlRateDecimal) * 10000; // Convert to basis points
};

/**
 * Determine which exchange to long/short based on funding rates
 * @param {number} hyperliquidRate - Hyperliquid funding rate (decimal)
 * @param {number} extendedRate - Extended funding rate (decimal)
 * @returns {object} Strategy recommendation
 */
export const getDeltaNeutralStrategy = (hyperliquidRate, extendedRate) => {
  const hlRateDecimal = hyperliquidRate;
  const exRateDecimal = extendedRate;

  if (hlRateDecimal > exRateDecimal) {
    return {
      short: { exchange: 'Hyperliquid', rate: hlRateDecimal * 100 },
      long: { exchange: 'Extended Exchange', rate: exRateDecimal * 100 },
      spread: (hlRateDecimal - exRateDecimal) * 100,
    };
  } else {
    return {
      short: { exchange: 'Extended Exchange', rate: exRateDecimal * 100 },
      long: { exchange: 'Hyperliquid', rate: hlRateDecimal * 100 },
      spread: (exRateDecimal - hlRateDecimal) * 100,
    };
  }
};

/**
 * Debug function to log rate formats
 */
export const debugRates = (asset, hyperliquidRate, extendedRate) => {
  console.log(`=== DEBUG RATES for ${asset} ===`);
  console.log(`Hyperliquid raw: ${hyperliquidRate} (decimal)`);
  console.log(`Extended raw: ${extendedRate} (decimal)`);
  console.log(`Hyperliquid as %: ${(hyperliquidRate * 100).toFixed(4)}%`);
  console.log(`Extended as %: ${(extendedRate * 100).toFixed(4)}%`);
  console.log(`Difference: ${Math.abs(hyperliquidRate - extendedRate) * 100}%`);
  console.log(
    `APY (Year): ${calculateDeltaNeutralAPY(
      hyperliquidRate,
      extendedRate,
      'year'
    ).toFixed(2)}%`
  );
  console.log('================================');
};
