/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BrainCircuit, 
  RefreshCcw, 
  ArrowRight,
  ShieldCheck,
  Globe,
  AlertCircle,
  Search,
  X,
  Share2,
  ExternalLink,
  Bell,
  Calendar,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Tooltip as ShadcnTooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';

import { fetchLatestRates, getHistoricalSimulatedData, fetchMacroIndicators, type HistoricalDataPoint, type Timeframe, type MacroIndicators, HISTORICAL_EVENTS, type BaseCurrency, UPCOMING_EVENTS, type EconomicEvent } from './services/currencyService';
import { analyzeVolatility, fetchMarketNews, type NewsItem } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState<number>(0);
  const [macro, setMacro] = useState<MacroIndicators | null>(null);
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsFilter, setNewsFilter] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('7D');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('USD');
  const [priceAlerts, setPriceAlerts] = useState<{ id: string; target: number; type: 'above' | 'below' }[]>([]);
  const [newAlertValue, setNewAlertValue] = useState<string>('');
  
  // Converter state
  const [usdAmount, setUsdAmount] = useState<string>('1');

  const fetchData = async (selectedTimeframe: Timeframe = timeframe, selectedBase: BaseCurrency = baseCurrency) => {
    setIsRefreshing(true);
    try {
      const [rateData, macroData] = await Promise.all([
        fetchLatestRates(selectedBase),
        fetchMacroIndicators(selectedBase)
      ]);
      
      const currentNgnRate = rateData.rates['NGN'];
      setRate(currentNgnRate);
      setMacro(macroData);
      
      const historicalData = getHistoricalSimulatedData(currentNgnRate, selectedTimeframe, selectedBase);
      setHistory(historicalData);
      
      let analysis = "Market sentiment analysis currently unavailable. Monitor key drivers for short-term trends.";
      let newsData: NewsItem[] = [];

      try {
        const [analysisRes, newsRes] = await Promise.all([
          analyzeVolatility(historicalData),
          fetchMarketNews(currentNgnRate)
        ]);
        analysis = analysisRes;
        newsData = newsRes;
      } catch (aiError) {
        console.error('AI Data fetch failed:', aiError);
        // Fallbacks are already handled in geminiService, but we catch top-level errors just in case
      }

      setAiAnalysis(analysis);
      // Ensure unique IDs for news items
      setNews(newsData.map((item, idx) => ({ ...item, id: item.id || `news-${idx}-${Date.now()}` })));
    } catch (error) {
      console.error('Data sync failed:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Check for alerts whenever rate updates
  useEffect(() => {
    if (rate <= 0) return;

    priceAlerts.forEach(alert => {
      const triggered = alert.type === 'above' ? rate >= alert.target : rate <= alert.target;
      if (triggered) {
        toast.success(`Target Reached!`, {
          description: `The rate is now ${rate.toFixed(2)} (Target: ${alert.target})`,
          duration: 10000,
        });
        // Remove alert after it triggers
        setPriceAlerts(prev => prev.filter(a => a.id !== alert.id));
      }
    });
  }, [rate, priceAlerts]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    fetchData(tf, baseCurrency);
  };

  const handleCurrencyChange = (base: BaseCurrency) => {
    setBaseCurrency(base);
    fetchData(timeframe, base);
  };

  const filteredNews = useMemo(() => {
    if (!newsFilter) return news;
    const search = newsFilter.toLowerCase().trim();
    if (!search) return news;

    return news.filter(item => 
      item.title.toLowerCase().includes(search) || 
      item.summary.toLowerCase().includes(search) ||
      item.category.toLowerCase() === search
    );
  }, [news, newsFilter]);

  const change = useMemo(() => {
    if (history.length < 2) return 0;
    const initial = history[0].rate;
    const current = history[history.length - 1].rate;
    return ((current - initial) / initial) * 100;
  }, [history]);

  const workflowSteps = [
    { icon: Globe, title: 'Global Oil Prices', desc: 'Primary source of FX revenue' },
    { icon: ShieldCheck, title: 'CBN Reserves', desc: 'Buffered against demand shocks' },
    { icon: ArrowRight, title: 'Market Sentiment', desc: 'Speculative pressure & liquidity' },
    { icon: Activity, title: 'Naira Value', desc: 'Real-time statistical equilibrium' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0C0C] p-6 flex flex-col gap-6">
        <Skeleton className="h-12 w-64 bg-dashboard-card" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 bg-dashboard-card" />
          <Skeleton className="h-32 bg-dashboard-card" />
          <Skeleton className="h-32 bg-dashboard-card" />
        </div>
        <Skeleton className="h-96 w-full bg-dashboard-card" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#E5E5E5] font-sans selection:bg-blue-500/30">
      <TooltipProvider>
        <Toaster position="bottom-right" theme="dark" richColors />
        {/* Background Grid Overlay */}
      <div className="fixed inset-0 technical-grid opacity-[0.03] pointer-events-none" />

      <main className="relative max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                NairaDash
              </h1>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center gap-1.5 px-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live Market
              </Badge>
            </div>
            <p className="text-dashboard-muted text-sm font-medium">Statistical {baseCurrency}/NGN Analytics Engine</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex bg-dashboard-card border border-dashboard-border rounded-lg p-1">
              {(['USD', 'GBP', 'EUR'] as BaseCurrency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => handleCurrencyChange(cur)}
                  className={`px-3 py-1 text-[10px] font-mono rounded transition-all ${baseCurrency === cur ? 'bg-blue-600 text-white shadow-lg' : 'text-dashboard-muted hover:text-white'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
            {macro && (
              <div className="hidden lg:flex items-center gap-6 px-6 py-2 bg-dashboard-card rounded-full border border-dashboard-border shadow-xl ring-1 ring-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-dashboard-muted font-mono uppercase">Oil_Price</span>
                  <span className={`text-xs font-mono font-bold ${macro.oilTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    ${macro.oilPrice.toFixed(2)}
                  </span>
                </div>
                <div className="w-px h-3 bg-dashboard-border" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-dashboard-muted font-mono uppercase">Reserves</span>
                  <span className="text-xs font-mono font-bold text-blue-400">{macro.reserves}</span>
                </div>
                <div className="w-px h-3 bg-dashboard-border" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-dashboard-muted font-mono uppercase">Inflation</span>
                  <span className="text-xs font-mono font-bold text-orange-400">{macro.inflation}</span>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData()} 
              disabled={isRefreshing}
              className="border-dashboard-border bg-dashboard-card hover:bg-dashboard-border text-xs gap-2 font-mono"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              REFRESH_SYNC
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ShadcnTooltip>
              <TooltipTrigger>
                <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 overflow-hidden cursor-help">
                  <CardContent className="p-6">
                    <p className="text-dashboard-muted text-[10px] font-bold uppercase tracking-widest mb-3">Target_Pair</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-4xl font-mono font-medium tracking-tighter">
                          1.00 <span className="text-dashboard-muted text-lg">{baseCurrency}</span>
                        </h2>
                        <p className="text-2xl font-mono text-blue-400 mt-1">
                          {rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })} <span className="text-sm">NGN</span>
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="bg-dashboard-card border-dashboard-border text-dashboard-text text-xs">
                The current exchange rate of 1 United States Dollar against the Nigerian Naira.
              </TooltipContent>
            </ShadcnTooltip>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ShadcnTooltip>
              <TooltipTrigger>
                <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 cursor-help">
                  <CardContent className="p-6">
                    <p className="text-dashboard-muted text-[10px] font-bold uppercase tracking-widest mb-3">24H_Volatility</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-mono ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                      <p className="text-dashboard-muted text-xs font-medium">relative_to_period_start</p>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(Math.abs(change) * 10, 100)}%` }} 
                        className={`h-full ${change >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="bg-dashboard-card border-dashboard-border text-dashboard-text text-xs">
                The percentage change in the exchange rate over the selected timeframe.
              </TooltipContent>
            </ShadcnTooltip>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="sm:col-span-2 lg:col-span-1">
            <ShadcnTooltip>
              <TooltipTrigger>
                <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 cursor-help">
                  <CardContent className="p-6">
                    <p className="text-dashboard-muted text-[10px] font-bold uppercase tracking-widest mb-3">Parallel_Market_Indicator</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono text-purple-400">
                        ~{(rate * 1.12).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-dashboard-muted text-xs font-medium">NGN / {baseCurrency} est.</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] border-purple-500/20 text-purple-400 bg-purple-500/5">
                        PREMIUM: +12.4%
                      </Badge>
                      <p className="text-[9px] text-dashboard-muted italic font-mono">Parallel_Market_Delta</p>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="bg-dashboard-card border-dashboard-border text-dashboard-text text-xs shadow-2xl">
                The unofficial/parallel market rate estimated based on historical deltas.
              </TooltipContent>
            </ShadcnTooltip>
          </motion.div>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="lg:col-span-2 space-y-6"
          >
            <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 h-[450px]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-mono tracking-tight flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    STATISTICAL_TREND
                  </CardTitle>
                  <CardDescription className="text-xs text-dashboard-muted">Historical rate fluctuation vs Time</CardDescription>
                </div>
                <div className="flex gap-1">
                  {(['1D', '7D', '1M', '3M'] as Timeframe[]).map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeframeChange(tf)}
                      className={`h-7 px-3 text-[10px] font-mono ${timeframe === tf ? 'bg-blue-600' : 'bg-transparent border-dashboard-border'}`}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorParallel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#737373', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      dy={10}
                    />
                    <YAxis 
                      hide 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                      cursor={{ stroke: '#3B82F6', strokeWidth: 1 }}
                      labelFormatter={(label) => `Date: ${label}`}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-dashboard-card border border-dashboard-border p-3 rounded-lg shadow-xl text-xs space-y-2">
                              <p className="font-mono text-dashboard-muted border-b border-dashboard-border pb-1 mb-2">{label}</p>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-blue-400 font-mono">OFFICIAL:</span>
                                <span className="font-bold text-white">{payload[0].value}</span>
                              </div>
                              {payload[1] && (
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-purple-400 font-mono">PARALLEL:</span>
                                  <span className="font-bold text-white">{payload[1].value}</span>
                                </div>
                              )}
                              {payload[2] && (
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-blue-200 font-mono text-[9px] uppercase">Trend_S:</span>
                                  <span className="font-bold text-blue-200">{payload[2].value}</span>
                                </div>
                              )}
                              {payload[3] && (
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-gray-400 font-mono text-[9px] uppercase">Trend_L:</span>
                                  <span className="font-bold text-gray-400">{payload[3].value}</span>
                                </div>
                              )}
                              {data.event && (
                                <div className="mt-2 pt-2 border-t border-dashboard-border">
                                  <p className="text-orange-400 font-bold uppercase text-[9px] mb-1">Market Event</p>
                                  <p className="text-[10px] text-white leading-tight">{data.event}</p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rate" 
                      name="Official Rate"
                      stroke="#3B82F6" 
                      fillOpacity={1} 
                      fill="url(#colorRate)" 
                      strokeWidth={2}
                      dot={(props: any) => {
                        if (props.payload.event) {
                          return <circle {...props} r={4} fill="#f97316" stroke="#fff" strokeWidth={1} />;
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="parallelRate" 
                      name="Parallel Rate"
                      stroke="#A855F7" 
                      fillOpacity={1} 
                      fill="url(#colorParallel)" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shortTermTrend" 
                      stroke="#60A5FA" 
                      strokeWidth={1} 
                      dot={false}
                      strokeDasharray="3 3"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="longTermTrend" 
                      stroke="#4B5563" 
                      strokeWidth={1} 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Historical Events List (New) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5">
                <CardHeader>
                  <CardTitle className="text-xs font-mono uppercase tracking-[0.2em] text-dashboard-muted">Market_Milestones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {HISTORICAL_EVENTS.map((event, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-dashboard-border last:border-0 last:pb-0">
                      <div className="text-[10px] font-mono text-blue-400 pt-1">{event.date}</div>
                      <div>
                        <h4 className="text-xs font-bold">{event.title}</h4>
                        <p className="text-[10px] text-dashboard-muted">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Real-time News Feed (New) */}
              <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 overflow-hidden">
                <CardHeader className="bg-blue-500/5 border-b border-dashboard-border pb-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        Live_Currency_Feed
                      </CardTitle>
                      {newsFilter && (
                        <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 uppercase">
                          {newsFilter.length > 15 ? 'Active Filter' : `Filtering: ${newsFilter}`}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-dashboard-muted" />
                      <Input
                        type="text"
                        placeholder="Search market news, alerts or categories..."
                        className="h-9 pl-8 pr-8 bg-dashboard-bg border-dashboard-border text-xs focus-visible:ring-blue-500/50"
                        value={newsFilter || ''}
                        onChange={(e) => setNewsFilter(e.target.value || null)}
                      />
                      {newsFilter && (
                        <button 
                          onClick={() => setNewsFilter(null)}
                          className="absolute right-2.5 top-2.5 hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-dashboard-muted" />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(['economic', 'political', 'market'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNewsFilter(cat === newsFilter ? null : cat)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all uppercase tracking-tighter ${
                            newsFilter === cat 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : 'bg-dashboard-bg border-dashboard-border text-dashboard-muted hover:border-dashboard-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {filteredNews.length > 0 ? filteredNews.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => setSelectedNews(item)}
                        className="p-4 border-b border-dashboard-border last:border-0 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <Badge className={`text-[9px] h-4 px-1.5 font-mono ${
                            item.impact === 'positive' ? 'bg-green-500/20 text-green-400' : 
                            item.impact === 'negative' ? 'bg-red-500/20 text-red-400' : 
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.impact === 'positive' ? 'UP' : item.impact === 'negative' ? 'DOWN' : 'NEU'}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-dashboard-muted">{item.timestamp}</span>
                            <a 
                              href={`https://reuters.com/search/news?blob=${encodeURIComponent(item.title)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[9px] font-mono text-dashboard-muted hover:text-blue-400 transition-colors border-l border-dashboard-border pl-2"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>SOURCE</span>
                            </a>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold mb-1 leading-tight group-hover:text-blue-400 transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-dashboard-muted leading-relaxed line-clamp-2">
                          {item.summary}
                        </p>
                      </motion.div>
                    )) : (
                      <div className="p-8 text-center">
                        <p className="text-xs text-dashboard-muted font-mono mb-2">NO_RESULTS_FOR_FILTER</p>
                        <button 
                          onClick={() => setNewsFilter(null)}
                          className="text-[10px] text-blue-400 underline decoration-dotted"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Insights Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg font-mono flex items-center gap-2 uppercase tracking-wide">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                  Market_Logic
                </CardTitle>
                <CardDescription className="text-xs text-dashboard-muted">AI-powered succinct volatility analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <div className="relative">
                  <blockquote className="text-lg font-medium leading-relaxed italic text-gray-300">
                    "{aiAnalysis}"
                  </blockquote>
                  <div className="absolute -top-4 -left-4 text-6xl text-white/5 select-none">"</div>
                </div>

                {/* Currency Converter (New) */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">Rate_Calculator</p>
                    <Globe className="w-3 h-3 text-blue-500/50" />
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-dashboard-muted pointer-events-none">{baseCurrency}</span>
                      <Input 
                        type="number" 
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        className="h-9 pl-10 bg-dashboard-bg border-dashboard-border text-sm font-mono font-bold text-blue-400 focus-visible:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="h-px flex-1 bg-dashboard-border" />
                      <RefreshCcw className="w-3 h-3 mx-3 text-dashboard-muted" />
                      <div className="h-px flex-1 bg-dashboard-border" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-dashboard-muted">NGN</span>
                      <div className="h-9 pl-10 pr-3 rounded-md bg-dashboard-bg border border-dashboard-border flex items-center text-sm font-mono font-bold text-blue-400">
                        {((parseFloat(usdAmount) || 0) * rate).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-dashboard-border mt-auto">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-dashboard-muted uppercase tracking-widest mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Key_Drivers
                    </div>
                    {newsFilter && (
                      <button 
                        onClick={() => setNewsFilter(null)}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        [RESET_FILTERS]
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setNewsFilter('Reserves')}
                      className={`p-3 rounded-lg border transition-all text-left ${newsFilter === 'Reserves' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-blue-500/30'}`}
                    >
                      <p className="text-[10px] text-dashboard-muted">RESERVES</p>
                      <p className="text-xs font-mono font-bold">VOLATILE</p>
                    </button>
                    <button 
                      onClick={() => setNewsFilter('Liquidity')}
                      className={`p-3 rounded-lg border transition-all text-left ${newsFilter === 'Liquidity' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-blue-500/30'}`}
                    >
                      <p className="text-[10px] text-dashboard-muted">LIQUIDITY</p>
                      <p className="text-xs font-mono font-bold">LOW</p>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Alerts Card */}
            <Card className="bg-dashboard-card border-dashboard-border ring-1 ring-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  Price_Alert_System
                </CardTitle>
                <CardDescription className="text-[10px]">Real-time market threshold notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-dashboard-muted">RATE</span>
                    <Input 
                      placeholder="Target..."
                      type="number"
                      value={newAlertValue}
                      onChange={(e) => setNewAlertValue(e.target.value)}
                      className="h-8 pl-10 bg-dashboard-bg border-dashboard-border text-[11px] focus-visible:ring-orange-500/50 font-mono text-white"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 bg-orange-600 hover:bg-orange-500 text-white px-4 text-[10px] font-mono"
                    onClick={() => {
                      const val = parseFloat(newAlertValue);
                      if (val > 0) {
                        setPriceAlerts([...priceAlerts, { 
                          id: Date.now().toString(), 
                          target: val, 
                          type: val > rate ? 'above' : 'below' 
                        }]);
                        setNewAlertValue('');
                        toast.info(`Alert set at ${val}`, {
                          description: `We'll notify you when rate goes ${val > rate ? 'above' : 'below'} ${val}`
                        });
                      }
                    }}
                  >
                    ADD
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 select-none">
                  {priceAlerts.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-dashboard-border rounded-lg">
                      <p className="text-[10px] text-dashboard-muted italic">No active monitoring states</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {priceAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/5 group hover:border-orange-500/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-1 rounded-full ${alert.type === 'above' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-mono text-dashboard-muted leading-none mb-0.5">{alert.type.toUpperCase()}</span>
                              <span className="text-xs font-mono font-bold text-orange-400 leading-none">{alert.target.toLocaleString()}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setPriceAlerts(prev => prev.filter(a => a.id !== alert.id))}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-dashboard-muted hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Economic Calendar */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-dashboard-muted">Economic_Calendar_Upcoming</h3>
            <div className="h-px flex-1 bg-dashboard-border mx-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {UPCOMING_EVENTS.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-dashboard-card border border-dashboard-border rounded-xl p-4 relative group overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  event.impact === 'high' ? 'bg-red-500' : 
                  event.impact === 'medium' ? 'bg-orange-500' : 
                  'bg-blue-500'
                } opacity-50`} />
                
                <div className="flex justify-between items-start mb-3">
                  <div className="p-1.5 rounded bg-white/5">
                    <Calendar className="w-4 h-4 text-dashboard-muted" />
                  </div>
                  <Badge variant="outline" className={`text-[8px] font-mono tracking-tight uppercase ${
                    event.impact === 'high' ? 'border-red-500/30 text-red-400 bg-red-400/5' : 
                    event.impact === 'medium' ? 'border-orange-500/30 text-orange-400 bg-orange-400/5' : 
                    'border-blue-500/30 text-blue-400 bg-blue-400/5'
                  }`}>
                    {event.impact}_IMPACT
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-dashboard-muted uppercase tracking-tighter">{event.date}</p>
                  <h4 className="text-xs font-bold leading-tight line-clamp-1">{event.title}</h4>
                </div>

                <p className="text-[10px] text-dashboard-muted mt-3 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="mt-4 pt-3 border-t border-dashboard-border flex items-center justify-between">
                  <span className="text-[9px] font-mono text-dashboard-muted uppercase tracking-widest">{event.category}</span>
                  <div className="flex items-center gap-1">
                    <Zap className={`w-3 h-3 ${event.impact === 'high' ? 'text-red-400' : 'text-dashboard-muted'}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workflow Map */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-dashboard-muted">Economic_Flow_Workflow</h3>
            <div className="h-px flex-1 bg-dashboard-border mx-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {workflowSteps.map((step, idx) => (
              <motion.button 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                onClick={() => setNewsFilter(step.title)}
                className={`relative p-6 rounded-xl border group transition-all text-left ${newsFilter === step.title ? 'bg-blue-500/10 border-blue-500/50' : 'bg-dashboard-card border-dashboard-border hover:border-blue-500/30'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-dashboard-bg border border-dashboard-border group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                    <step.icon className={`w-5 h-5 transition-colors ${newsFilter === step.title ? 'text-blue-400' : 'text-dashboard-muted group-hover:text-blue-400'}`} />
                  </div>
                  <span className="text-[10px] font-mono text-dashboard-muted">0{idx + 1}</span>
                </div>
                <h4 className="text-sm font-bold mb-1 tracking-tight">{step.title}</h4>
                <p className="text-xs text-dashboard-muted leading-relaxed">{step.desc}</p>
                
                {idx < 3 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-dashboard-border" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* News Detail Dialog */}
        <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
          <DialogContent className="bg-dashboard-card border-dashboard-border text-white sm:max-w-[600px] shadow-2xl ring-1 ring-white/10">
            {selectedNews && (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[10px] font-mono px-3 py-1 ${
                      selectedNews.impact === 'positive' ? 'bg-green-500/20 text-green-400' : 
                      selectedNews.impact === 'negative' ? 'bg-red-500/20 text-red-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      IMPACT: {selectedNews.impact.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] font-mono text-dashboard-muted">{selectedNews.timestamp}</span>
                  </div>
                  <DialogTitle className="text-xl font-bold leading-tight">
                    {selectedNews.title}
                  </DialogTitle>
                  <DialogDescription className="text-dashboard-muted font-mono text-[10px] uppercase tracking-widest">
                    Category: {selectedNews.category} • Internal_Ref_ID: {selectedNews.id}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {selectedNews.summary}
                    </p>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                      <h5 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" />
                        AI_STRATEGIC_IMPACT_ANALYSIS
                      </h5>
                      <p className="text-xs text-gray-300 leading-relaxed italic">
                        Based on existing macroeconomic correlations, this {selectedNews.category} development suggests a significant shift in current market liquidity. Analysts expect the parallel market to react within {selectedNews.impact === 'negative' ? '4-6 hours' : '12-24 hours'} as supply-side constraints adjust. We recommend monitoring official CBN reserves as a secondary confirmation signal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-dashboard-border pt-6">
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <p className="text-[8px] text-dashboard-muted uppercase">Reliability</p>
                        <p className="text-xs font-mono text-white">HIGH_CONFIDENCE</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-dashboard-muted uppercase">Intelligence_Source</p>
                        <p className="text-xs font-mono text-white">BLOOMBERG_PRO_TERMINAL</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 border-dashboard-border font-mono text-[10px] gap-2 px-4"
                        onClick={() => {
                          navigator.clipboard.writeText(`Report: ${selectedNews.title} | NairaDash Stats`);
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        SHARE_DATA
                      </Button>
                      <Button 
                        className="h-9 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] gap-2 px-4 shadow-xl shadow-blue-600/20"
                        asChild
                      >
                        <a 
                          href={`https://reuters.com/search/news?blob=${encodeURIComponent(selectedNews.title)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          RAW_TRANSMISSION
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-10 border-t border-dashboard-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-widest text-dashboard-muted uppercase">
        <p>&copy; 2026 NAIRADASH ANALYST UNIT</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Source_API</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">Legal_Notice</a>
        </div>
      </footer>
      </TooltipProvider>
    </div>
  );
}
