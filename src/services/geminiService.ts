import { GoogleGenerativeAI } from "@google/generative-ai";
import { type HistoricalDataPoint } from "./currencyService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
  category: 'economic' | 'political' | 'market';
  timestamp: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'mock-1',
    title: 'CBN Injects $50m into Retail FX Market',
    summary: 'The Central Bank of Nigeria has sustained its intervention in the retail segment of the foreign exchange market to stabilize the Naira.',
    impact: 'positive',
    category: 'economic',
    timestamp: '1h ago'
  },
  {
    id: 'mock-2',
    title: 'Global Oil Prices Dip Below $82',
    summary: 'Brent crude fell amid global demand concerns, potentially affecting Nigeria\'s foreign exchange inflows.',
    impact: 'negative',
    category: 'market',
    timestamp: '3h ago'
  },
  {
    id: 'mock-3',
    title: 'Inflation Data Release Scheduled for Friday',
    summary: 'Market participants are awaiting the latest NBS report to assess the impact on future interest rate decisions.',
    impact: 'neutral',
    category: 'economic',
    timestamp: '5h ago'
  },
  {
    id: 'mock-4',
    title: 'Nigeria to Launch New Trade Policy Framework',
    summary: 'The Ministry of Trade is finalizing a framework designed to boost non-oil exports and improve market liquidity.',
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate 4 realistic news items related to the USD/NGN exchange rate (current rate: ${currentRate || 'unknown'}). 
    Include:
    - title: Short headline
    - summary: One sentence on currency impact
    - impact: 'positive', 'negative', or 'neutral' (relative to Naira strength)
    - category: 'economic', 'political', or 'market'
    - timestamp: Short string (e.g., '1h ago')
    
    Return as a JSON array named 'news'.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(response.text());
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const currentRate = data[data.length - 1]?.rate || 0;
    const prompt = `Current USD/NGN rate is ${currentRate}. Historical data: ${JSON.stringify(data.slice(-5))}. 
    In EXACTLY two sentences, explain the current volatility based on Nigerian macroeconomic factors like oil prices, foreign reserves, and inflation.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    const response = await result.response;
    return response.text() || defaultAnalysis;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return defaultAnalysis;
  }
};
