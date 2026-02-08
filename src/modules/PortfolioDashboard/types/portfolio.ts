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
}

export interface YahooQuoteData {
  symbol: string;
  regularMarketPrice: number | null;
  trailingPE: number | null;
  error?: string;
}
