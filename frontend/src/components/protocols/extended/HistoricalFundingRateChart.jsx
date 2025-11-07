'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

/**
 * Historical Funding Rate Chart Component (Hour-Aligned to Europe/Zurich)
 * - Requests data aligned to the last full hour in Switzerland (Europe/Zurich)
 * - Normalizes datapoints to round hours in Europe/Zurich
 * - Axis ticks/labels & tooltips show Europe/Zurich local time
 */

// === Config ===
const TIME_ZONE = 'Europe/Zurich';
const LOCALE = 'en-GB'; // or 'fr-CH' if you prefer
const MS_PER_HOUR = 3_600_000;

// Time period configurations
const TIME_PERIODS = {
  '24h': {
    label: '24 Hours',
    hours: 24,
    dataPoints: 24, // 1 data point per hour
    description: 'Last 24 hours with hourly data points'
  },
  '7d': {
    label: '7 Days',
    hours: 7 * 24,
    dataPoints: 7 * 24, // 1 data point per hour
    description: 'Last 7 days with hourly data points'
  },
  '30d': {
    label: '30 Days',
    hours: 30 * 24,
    dataPoints: 30 * 24, // 1 data point per hour
    description: 'Last 30 days with hourly data points'
  }
};

// ===== Timezone helpers (no external libs) =====
function getZonedParts(tsMs, timeZone = TIME_ZONE) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(tsMs)).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * Convert an arbitrary timestamp to the UTC ms of the **top of the hour**
 * in the specified time zone (e.g., Europe/Zurich). Works across DST.
 */
function normalizeToHourInZone(tsMs, timeZone = TIME_ZONE) {
  const { year, month, day, hour } = getZonedParts(tsMs, timeZone);
  return Date.UTC(year, month - 1, day, hour, 0, 0, 0);
}

/**
 * Compute [startTime, endTime] aligned to the last full hour in Europe/Zurich.
 */
function getPeriodBounds(selectedPeriodKey) {
  const period = TIME_PERIODS[selectedPeriodKey];
  if (!period || typeof period.hours !== 'number') {
    throw new Error(`Invalid period: ${selectedPeriodKey}`);
  }
  const now = Date.now();
  const endTime = normalizeToHourInZone(now, TIME_ZONE); // last full local hour -> UTC ms
  const startTime = endTime - period.hours * MS_PER_HOUR;
  return { startTime, endTime, hours: period.hours, dataPoints: period.dataPoints };
}

function formatInZone(tsMs, opts = {}) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...opts }).format(new Date(tsMs));
}

/**
 * Fetch funding history for chart
 */
const fetchFundingHistory = async (market, startTime, endTime, limit = 1000) => {
  try {
    // Log what we're sending to the API in both UTC & Zurich time
    console.log('📤 API Request params:', {
      market,
      startTime,
      endTime,
      startISO_UTC: new Date(startTime).toISOString(),
      endISO_UTC: new Date(endTime).toISOString(),
      start_Zurich: formatInZone(startTime, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' }),
      end_Zurich: formatInZone(endTime, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' }),
      limit,
    });

    const response = await fetch(
      `/api/extended/info/${market}/funding?startTime=${startTime}&endTime=${endTime}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      throw new Error(data.error?.message || 'API returned error');
    }

    return data.data || [];
  } catch (error) {
    console.error(`Error fetching funding history for ${market}:`, error);
    throw error;
  }
};

/**
 * Hook for managing chart data
 */
const useFundingRateChart = (market, selectedPeriod) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchChartData = useCallback(async () => {
    if (!market || !selectedPeriod) return;

    setLoading(true);
    setError(null);

    try {
      const { startTime, endTime, dataPoints } = getPeriodBounds(selectedPeriod);

      console.log('🕐 Time calculation:', {
        nowISO_UTC: new Date().toISOString(),
        startISO_UTC: new Date(startTime).toISOString(),
        endISO_UTC: new Date(endTime).toISOString(),
        start_Zurich: formatInZone(startTime, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' }),
        end_Zurich: formatInZone(endTime, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' }),
        period: selectedPeriod,
        hours: TIME_PERIODS[selectedPeriod]?.hours,
      });

      const history = await fetchFundingHistory(market, startTime, endTime, dataPoints);

      console.log(`📥 Raw API data sample (first 3):`, history.slice(0, 3).map(item => ({
        T: item.T,
        timestamp: item.timestamp,
        f: item.f,
        dateFromT_UTC: item.T != null ? new Date(Number(item.T) * 1000).toISOString() : 'No T',
        dateFromTimestamp_UTC: item.timestamp != null ? new Date(Number(item.timestamp)).toISOString() : 'No timestamp'
      })));

      // Transform & normalize to exact Zurich round hours
      const points = history
        .map((item) => {
          const tsMs = item?.T != null ? Number(item.T) * 1000 : Number(item.timestamp);
          if (!Number.isFinite(tsMs)) return null;

          const hourTs = normalizeToHourInZone(tsMs, TIME_ZONE); // UTC ms for the Zurich hour top
          if (!Number.isFinite(hourTs)) return null;

          const rate = Number(item.f ?? item.fundingRate ?? 0);
          return {
            timestamp: hourTs,
            fundingRate: rate,
            fundingRatePercent: rate * 100,
            time: new Date(hourTs).toISOString(), // UTC ISO
            market: item.m || market,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp);

      // Dedupe to a single point per hour (keep the last one seen per hour)
      const byHour = new Map();
      for (const p of points) byHour.set(p.timestamp, p);
      const chartData = Array.from(byHour.values()).sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📊 Chart data prepared (Zurich hour-aligned): ${chartData.length} points`);
      console.log('First/Last (Zurich):', chartData[0] && {
        first_Zurich: formatInZone(chartData[0].timestamp, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' }),
        last_Zurich: formatInZone(chartData[chartData.length - 1].timestamp, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit' })
      });

      setData(chartData);
      setLastUpdate(new Date());
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [market, selectedPeriod]);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  return { data, loading, error, lastUpdate, refetch: fetchChartData };
};

/**
 * Custom Tooltip for the chart (Europe/Zurich)
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const ts = data.timestamp; // already round hour

    const labelLocal = formatInZone(ts, {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{labelLocal} {TIME_ZONE.replace('Europe/', '')}</p>
        <p className="text-xs text-gray-500">UTC: {new Date(ts).toISOString()}</p>
        <p className="text-sm">
          <span className="text-gray-600">Funding Rate: </span>
          <span className={`font-mono font-semibold ${data.fundingRatePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data.fundingRatePercent >= 0 ? '+' : ''}{data.fundingRatePercent.toFixed(4)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

/** Custom Dot */
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  return (
    <circle cx={cx} cy={cy} r={2} fill={payload.fundingRatePercent >= 0 ? '#dc2626' : '#16a34a'} stroke="#fff" strokeWidth={1} />
  );
};

export default function HistoricalFundingRateChart({ market, onMarketChange, availableMarkets = [] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const { data, loading, error, lastUpdate, refetch } = useFundingRateChart(market, selectedPeriod);

  // Calculate statistics
  const stats = data.length > 0 ? {
    current: data[data.length - 1]?.fundingRatePercent || 0,
    min: Math.min(...data.map(d => d.fundingRatePercent)),
    max: Math.max(...data.map(d => d.fundingRatePercent)),
    average: data.reduce((sum, d) => sum + d.fundingRatePercent, 0) / data.length,
    dataPoints: data.length
  } : null;

  // Generate ticks that align exactly with our hourly datapoints (and decimate for readability)
  const ticks = useMemo(() => {
    if (!data?.length) return undefined;
    const step = selectedPeriod === '24h' ? 2 : (selectedPeriod === '7d' ? 6 : 12); // every N hours
    return data.filter((_, i) => i % step === 0).map(d => d.timestamp);
  }, [data, selectedPeriod]);

  const formatAxisLabel = (timestamp) => {
    if (selectedPeriod === '24h') {
      return formatInZone(timestamp, { hour: '2-digit', minute: '2-digit' }); // HH:00
    } else if (selectedPeriod === '7d') {
      return formatInZone(timestamp, { day: '2-digit', month: '2-digit', hour: '2-digit' }); // DD/MM HH
    } else {
      return formatInZone(timestamp, { day: '2-digit', month: '2-digit' }); // DD/MM
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Historical Funding Rates</h2>
            <p className="text-gray-600">{market ? `${market} funding rate history` : 'Select a market to view funding rate history'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} disabled={loading || !market} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {lastUpdate && <div className="text-xs text-gray-500">Updated: {lastUpdate.toLocaleTimeString()}</div>}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Market Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
            <select value={market || ''} onChange={(e) => onMarketChange?.(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select a market...</option>
              {availableMarkets.map((marketName) => (
                <option key={marketName} value={marketName}>{marketName}</option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <div className="flex gap-2">
              {Object.entries(TIME_PERIODS).map(([key, period]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Rate</label>
              <div className={`text-lg font-mono font-bold ${stats.current >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.current >= 0 ? '+' : ''}{stats.current.toFixed(4)}%
              </div>
            </div>
          )}
        </div>

        {/* Period Description */}
        <div className="text-sm text-gray-600">{TIME_PERIODS[selectedPeriod].description} (Europe/Zurich)</div>
      </div>

      {/* Chart Container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {!market ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a 2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">Select a market to view chart</p>
              <p className="text-sm text-gray-500">Choose from the dropdown above</p>
            </div>
          </div>
        ) : loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading funding rate history...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-2">Error loading data</div>
              <div className="text-sm text-gray-500 mb-4">{error}</div>
              <button onClick={refetch} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Try Again</button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No funding rate data available</p>
              <p className="text-sm">for {market} in the selected time period</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={[data[0].timestamp, data[data.length - 1].timestamp]}
                    ticks={ticks}
                    tickFormatter={formatAxisLabel}
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    dataKey="fundingRatePercent"
                    tickFormatter={(value) => `${Number(value).toFixed(3)}%`}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
                  <Line
                    type="monotone"
                    dataKey="fundingRatePercent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Data Points</div>
                  <div className="text-lg font-semibold text-gray-900">{stats.dataPoints}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Current</div>
                  <div className={`text-lg font-mono font-semibold ${stats.current >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.current >= 0 ? '+' : ''}{stats.current.toFixed(4)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Average</div>
                  <div className={`text-lg font-mono font-semibold ${stats.average >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.average >= 0 ? '+' : ''}{stats.average.toFixed(4)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Minimum</div>
                  <div className="text-lg font-mono font-semibold text-green-600">{stats.min.toFixed(4)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Maximum</div>
                  <div className="text-lg font-mono font-semibold text-red-600">+{stats.max.toFixed(4)}%</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 text-sm">
            <h3 className="font-medium text-blue-800">Chart Information</h3>
            <div className="mt-2 text-blue-700">
              <p><strong>Time zone:</strong> Europe/Zurich (local hour alignment)</p>
              <p><strong>Time periods:</strong> 24h (hourly), 7d (hourly), 30d (hourly)</p>
              <p><strong>Data points:</strong> Up to 1000 data points per request with 1-hour intervals</p>
              <p><strong>Color coding:</strong> Red dots = positive rates, Green dots = negative rates</p>
              <p><strong>Zero line:</strong> Reference line at 0% funding rate</p>
              <p><strong>Updates:</strong> Click refresh to get latest data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
