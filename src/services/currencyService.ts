export interface ExchangeRateData {
  base: string;
  rates: { [key: string]: number };
  time_last_update_utc: string;
}

export interface MacroIndicators {
  oilPrice: number;
  oilTrend: 'up' | 'down';
  reserves: string;
  inflation: string;
}

export interface HistoricalDataPoint {
  date: string;
  rate: number;
  parallelRate?: number;
  ghsRate?: number;
  zarRate?: number;
  shortTermTrend?: number;
  longTermTrend?: number;
  event?: string;
}

export type Timeframe = '1D' | '7D' | '1M' | '3M';
export type BaseCurrency = 'USD' | 'GBP' | 'EUR';

export interface EconomicEvent {
  id: string;
  title: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  category: 'policy' | 'inflation' | 'global' | 'liquidity';
  description: string;
}

export const UPCOMING_EVENTS: EconomicEvent[] = [
  { id: '1', title: 'MPC Interest Rate Decision', date: '2026-05-12', impact: 'high', category: 'policy', description: 'CBN board meeting to set the benchmark interest rate.' },
  { id: '2', title: 'CPI Inflation Data (April)', date: '2026-05-15', impact: 'high', category: 'inflation', description: 'National Bureau of Statistics releases consumer price index.' },
  { id: '3', title: 'OPEC+ Ministerial Meeting', date: '2026-06-01', impact: 'medium', category: 'global', description: 'Review of crude oil production quotas for member nations.' },
  { id: '4', title: 'NTB Primary Market Auction', date: '2026-05-08', impact: 'medium', category: 'liquidity', description: 'Regular auction of Treasury Bills to manage market liquidity.' },
  { id: '5', title: 'US Fed Interest Rate Decision', date: '2026-05-03', impact: 'high', category: 'policy', description: 'US Federal Reserve meeting on interest rates and monetary policy.' },
];

export const HISTORICAL_EVENTS = [
  { date: '2023-06-14', title: 'FX Window Unification', description: 'CBN unified all segments of the forex market.' },
  { date: '2024-01-30', title: 'Circular on Net Open Position', description: 'CBN issued guidelines to banks on limit of foreign currency assets.' },
  { date: '2024-02-27', title: '800bps Rate Hike', description: 'MPC raised interest rates significantly to combat inflation.' },
];

export const fetchLatestRates = async (base: BaseCurrency = 'USD'): Promise<ExchangeRateData> => {
  const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!response.ok) throw new Error('Failed to fetch rates');
  return response.json();
};

export const fetchMacroIndicators = async (base: BaseCurrency = 'USD'): Promise<MacroIndicators> => {
  // Simulating live macro data relative to currency
  const multiplier = base === 'GBP' ? 1.25 : base === 'EUR' ? 1.08 : 1;
  return {
    oilPrice: (82.45 * multiplier) + (Math.random() * 2 - 1),
    oilTrend: Math.random() > 0.5 ? 'up' : 'down',
    reserves: '$34.2B',
    inflation: '31.7%'
  };
};

export const getHistoricalSimulatedData = (currentRate: number, timeframe: Timeframe, base: BaseCurrency = 'USD'): HistoricalDataPoint[] => {
  const points: HistoricalDataPoint[] = [];
  const now = new Date();
  let days = 7;
  
  if (timeframe === '1D') days = 1;
  else if (timeframe === '7D') days = 7;
  else if (timeframe === '1M') days = 30;
  else if (timeframe === '3M') days = 90;

  let currentSimRate = currentRate * (0.95 + Math.random() * 0.1);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    if (timeframe === '1D') {
      date.setHours(now.getHours() - i);
    } else {
      date.setDate(now.getDate() - i);
    }
    
    // Create a more "trend-like" walk instead of pure random for smoother trends
    const drift = timeframe === '1D' ? 0 : 0.002; // slight upward drift
    const volatility = (Math.random() - 0.5 + drift) * 0.02;
    currentSimRate = currentSimRate * (1 + volatility);
    
    // Parallel rate is usually 5-15% higher than official
    const parallelRate = currentSimRate * (1.08 + Math.random() * 0.05);
    
    // Simulate other currencies with similar but distinct regional trends
    // NGN/USD ~ 1400, GHS/USD ~ 13, ZAR/USD ~ 19
    const ghsSeed = base === 'USD' ? 13 : base === 'GBP' ? 16 : 14;
    const zarSeed = base === 'USD' ? 19 : base === 'GBP' ? 24 : 20;
    
    const ghsRate = ghsSeed * (0.98 + Math.random() * 0.04) * (1 + (i * 0.001));
    const zarRate = zarSeed * (0.99 + Math.random() * 0.02) * (1 - (i * 0.0005));

    const dateStr = date.toISOString().split('T')[0];
    const event = HISTORICAL_EVENTS.find(e => e.date === dateStr);
    
    points.push({
      date: timeframe === '1D' 
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: parseFloat(currentSimRate.toFixed(2)),
      parallelRate: parseFloat(parallelRate.toFixed(2)),
      ghsRate: parseFloat(ghsRate.toFixed(2)),
      zarRate: parseFloat(zarRate.toFixed(2)),
      event: event?.title
    });
  }
  
  // Update final point to current actual rate
  points[points.length - 1].rate = currentRate;
  points[points.length - 1].parallelRate = currentRate * 1.12;

  // Add trends after generating all points
  return points.map((p, idx) => {
    // Simple windowed averages for trends
    const shortWindow = points.slice(Math.max(0, idx - 3), idx + 1);
    const longWindow = points.slice(Math.max(0, idx - 10), idx + 1);
    
    const shortAvg = shortWindow.reduce((sum, dp) => sum + dp.rate, 0) / shortWindow.length;
    const longAvg = longWindow.reduce((sum, dp) => sum + dp.rate, 0) / longWindow.length;

    return {
      ...p,
      shortTermTrend: parseFloat(shortAvg.toFixed(2)),
      longTermTrend: parseFloat(longAvg.toFixed(2))
    };
  });
};
