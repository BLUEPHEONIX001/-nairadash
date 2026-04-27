import { GoogleGenAI } from "@google/genai";
import { type HistoricalDataPoint } from "./currencyService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  impact: 'positive' | 'negative' | 'neutral';
  category: 'economic' | 'political' | 'market';
  timestamp: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'mock-1',
    title: 'CBN Injects $50m into Retail FX Market',
    summary: 'The Central Bank of Nigeria has sustained its intervention in the retail segment of the foreign exchange market to stabilize the Naira.',
    content: 'In its ongoing effort to maintain exchange rate stability and ensure liquidity in the foreign exchange market, the Central Bank of Nigeria (CBN) has announced a fresh injection of $50 million into the retail secondary market intervention sales (SMIS). This move is targeted at meeting the demands of small and medium enterprises (SMEs) and individuals for school fees, medical bills, and other essential invisible transactions. Experts suggest this frequent intervention is a tactical bridge while structural reforms to boost foreign reserve levels are implemented.',
    imageUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',
    impact: 'positive',
    category: 'economic',
    timestamp: '1h ago'
  },
  {
    id: 'mock-2',
    title: 'Global Oil Prices Dip Below $82',
    summary: 'Brent crude fell amid global demand concerns, potentially affecting Nigeria\'s foreign exchange inflows.',
    content: 'Global oil benchmark Brent crude slipped below the $82 per barrel mark on Wednesday as concerns over dampened global demand offset optimism surrounding tighter supply from major producers. For Nigeria, a decrease in oil prices directly impacts the country\'s fiscal capacity and foreign exchange reserves, as crude oil exports remain the primary source of dollar inflows. Should this downward trend persist, market analysts warn of increased pressure on the Naira as reserve accruals slow down.',
    imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80',
    impact: 'negative',
    category: 'market',
    timestamp: '3h ago'
  },
  {
    id: 'mock-3',
    title: 'Inflation Data Release Scheduled for Friday',
    summary: 'Market participants are awaiting the latest NBS report to assess the impact on future interest rate decisions.',
    content: 'The National Bureau of Statistics (NBS) is set to release the Consumer Price Index (CPI) report for the previous month this Friday. Investors and policymakers are closely watching this data point as it will likely dictate the Central Bank\'s next move during the Monetary Policy Committee (MPC) meeting. With current inflation levels testing multi-year highs, a further spike could trigger another round of interest rate hikes, aimed at mopping up excess liquidity and curbing currency depreciation.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    impact: 'neutral',
    category: 'economic',
    timestamp: '5h ago'
  },
  {
    id: 'mock-4',
    title: 'Nigeria to Launch New Trade Policy Framework',
    summary: 'The Ministry of Trade is finalizing a framework designed to boost non-oil exports and improve market liquidity.',
    content: 'The Federal Ministry of Industry, Trade and Investment has revealed that it is finalizing a comprehensive New Trade Policy Framework. The framework aims to diversify the country\'s revenue base by providing significant incentives for non-oil exporters, simplifying export documentation processes, and enhancing trade facilitation at the ports. By strengthening non-oil export earnings, the government hopes to create a more resilient foreign exchange supply chain and reduce the economy\'s over-reliance on volatile crude oil prices.',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cd0ebf62?auto=format&fit=crop&w=800&q=80',
    impact: 'positive',
    category: 'political',
    timestamp: '8h ago'
  }
];

export const fetchMarketNews = async (currentRate?: number): Promise<NewsItem[]> => {
  if (!process.env.GEMINI_API_KEY) {
    return MOCK_NEWS;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 realistic news items related to the USD/NGN exchange rate (current rate: ${currentRate || 'unknown'}). 
      Include:
      - title: Short headline
      - summary: One sentence on currency impact
      - content: A detailed 3-4 sentence paragraph about the event and its economic implications for Nigeria.
      - imageUrl: A relevant Unsplash image URL using this pattern: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=800&q=80. 
        Select from these safe IDs: 
        1512428559087-560fa5ceab42 (Central Bank), 
        1580519542036-c47de6196ba5 (Global Market), 
        1460925895917-afdab827c52f (Analytics), 
        1526304640581-d334cd0ebf62 (Money), 
        1611974714025-4fc159931336 (Trading),
        1553729450-45c3870511a0 (Meeting/Politics)
      - impact: 'positive', 'negative', or 'neutral' (relative to Naira strength)
      - category: 'economic', 'political', or 'market'
      - timestamp: Short string (e.g., '1h ago')
      
      Return as a JSON array named 'news'.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed.news || MOCK_NEWS;
  } catch (error) {
    console.error("News generation failed:", error);
    return MOCK_NEWS;
  }
};

export const analyzeVolatility = async (data: HistoricalDataPoint[]): Promise<string> => {
  const defaultAnalysis = "Market volatility is currently driven by a combination of shifting foreign reserves and global oil price fluctuations. These structural factors maintain pressure on the exchange rate equilibrium.";

  if (!process.env.GEMINI_API_KEY) {
    return defaultAnalysis;
  }

  try {
    const currentRate = data[data.length - 1]?.rate || 0;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current USD/NGN rate is ${currentRate}. Historical data: ${JSON.stringify(data.slice(-5))}. 
      In EXACTLY two sentences, explain the current volatility based on Nigerian macroeconomic factors like oil prices, foreign reserves, and inflation.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || defaultAnalysis;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return defaultAnalysis;
  }
};

export const predictWhatIf = async (oilPrice: number, inflation: number, currentRate: number): Promise<string> => {
  const fallback = "Simulation data is currently restricted. Baseline projections suggest that an increase in inflation without corresponding productivity gains will continue to test the Naira's support levels.";
  
  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an economic forecaster, predict the impact on the USD/NGN rate if:
      - Global Oil Price shifts to $${oilPrice}/barrel
      - Local Inflation rate shifts to ${inflation}%
      Current Rate: ${currentRate}
      
      Provide a concise 2-3 sentence prediction about the likely direction of the Naira and the reasoning behind it.`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || fallback;
  } catch (error) {
    console.error("What-If prediction failed:", error);
    return fallback;
  }
};
