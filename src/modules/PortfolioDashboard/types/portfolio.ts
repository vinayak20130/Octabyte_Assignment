export type Exchange = 'NSE' | 'BSE';

export type Sector =
  | 'Financial'
  | 'Tech'
  | 'Consumer'
  | 'Power'
  | 'Pipe'
  | 'Others';

export interface StockHolding {
  id: string;
  name: string;
  sector: Sector;
  purchasePrice: number;
  quantity: number;
  exchange: Exchange;
  exchangeCode: string;
  yahooSymbol: string;
  googleSymbol: string;
}

export interface YahooQuoteData {
  symbol: string;
  regularMarketPrice: number | null;
  trailingPE: number | null;
  epsTrailingTwelveMonths: number | null;
  error?: string;
}
export interface GoogleFinanceData {
  ticker: string;
  peRatio: number | null;
  eps: number | null;
  error?: string;
  strategy?: 'stable-selectors' | 'css-selectors';
}

export interface EnrichedStockRow {
  id: string;
  name: string;
  sector: Sector;
  purchasePrice: number;
  quantity: number;
  exchange: Exchange;
  exchangeCode: string;
  investment: number;
  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  portfolioPercent: number;
  peRatio: number | null;
  latestEarnings: number | null;
  hasError: boolean;
  errorMessages: string[];
}

export interface SectorSummary {
  sector: Sector;
  stockCount: number;
  totalInvestment: number;
  totalPresentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
}

export interface PortfolioResponse {
  sectors: Array<{ summary: SectorSummary; stocks: EnrichedStockRow[] }>;
  grandTotal: {
    totalInvestment: number;
    totalPresentValue: number | null;
    totalGainLoss: number | null;
    totalGainLossPercent: number | null;
  };
  lastUpdated: string;
  errors: string[];
}
