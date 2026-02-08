import YahooFinance from 'yahoo-finance2';
import type { YahooQuoteData } from '../types/portfolio';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, YahooQuoteData>> {
  const results = new Map<string, YahooQuoteData>();

  for (const symbol of symbols) {
    try {
      const quote = (await yf.quote(symbol)) as Record<string, unknown>;
      results.set(symbol, {
        symbol,
        regularMarketPrice: (quote.regularMarketPrice as number) ?? null,
        trailingPE: (quote.trailingPE as number) ?? null,
      });
    } catch (err) {
      results.set(symbol, {
        symbol,
        regularMarketPrice: null,
        trailingPE: null,
        error: `Yahoo fetch failed: ${(err as Error).message}`,
      });
    }
  }

  return results;
}
