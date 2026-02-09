import YahooFinance from 'yahoo-finance2';
import type { YahooQuoteData } from '../types/portfolio';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, YahooQuoteData>> {
  const quotes = new Map<string, YahooQuoteData>();

  // yahoo-finance2 only supports single-symbol queries, so we have to loop.
  // We intentionally don't parallelize — Yahoo aggressively rate-limits burst requests.
  for (const symbol of symbols) {
    try {
      const quote = (await yf.quote(symbol)) as Record<string, unknown>;
      quotes.set(symbol, {
        symbol,
        regularMarketPrice: (quote.regularMarketPrice as number) ?? null,
        trailingPE: (quote.trailingPE as number) ?? null,
        epsTrailingTwelveMonths: (quote.epsTrailingTwelveMonths as number) ?? null,
      });
    } catch (err) {
      quotes.set(symbol, {
        symbol,
        regularMarketPrice: null,
        trailingPE: null,
        epsTrailingTwelveMonths: null,
        error: `Yahoo fetch failed: ${(err as Error).message}`,
      });
    }
  }

  return quotes;
}
