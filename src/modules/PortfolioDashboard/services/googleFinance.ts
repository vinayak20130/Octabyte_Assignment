import * as cheerio from 'cheerio';
import type { GoogleFinanceData } from '../types/portfolio';
import { cache } from '@/common/utils/cache';
import { runWithConcurrency } from '@/common/utils/concurrency';
import config from './selectorConfig.json';

const BASE_URL = 'https://www.google.com/finance/quote';
const CACHE_TTL = 300_000;
const CONCURRENCY = 3;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
];

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Google Finance has no public API, so we scrape HTML. Selectors live in
// selectorConfig.json so we can patch them without a code change when Google
// inevitably redesigns the page.
function extractFinancials($: cheerio.CheerioAPI): {
  peRatio: number | null;
  eps: number | null;
} {
  let peRatio: number | null = null;
  const { containerClass, labelClass, valueClass } = config.keyStats;

  $(`div.${containerClass}`).each((_, container) => {
    const label = $(container).find(`div.${labelClass}`).text().trim();
    if (label.toLowerCase().includes('p/e ratio')) {
      const raw = $(container).find(`div.${valueClass}`).text().trim();
      const n = parseFloat(raw.replace(/[^\d.\-]/g, ''));
      if (!isNaN(n)) peRatio = n;
    }
  });

  let eps: number | null = null;
  const script = $(`script[class="${config.eps.scriptClass}"]`).html();

  if (script) {
    const match = script.match(/data:([\s\S]*?),\s*sideChannel/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const { quarterly: q, annual: a } = config.eps;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qVal = (data as any)?.[0]?.[0]?.[0]?.[0]?.[q.dataOffset]?.[
          q.epsIndex
        ];
        if (typeof qVal === 'number') eps = qVal;

        if (eps === null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aVal = (data as any)?.[0]?.[0]?.[1]?.[0]?.[a.dataOffset]?.[
            a.epsIndex
          ];
          if (typeof aVal === 'number') eps = aVal;
        }
      } catch { /* bad JSON, skip */ }
    }
  }

  return { peRatio, eps };
}

async function scrapeStock(
  googleSymbol: string,
): Promise<GoogleFinanceData> {
  const url = `${BASE_URL}/${googleSymbol}`;
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': ua, 'Accept-Language': 'en-US,en;q=0.9' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const $ = cheerio.load(await res.text());
    const { peRatio, eps } = extractFinancials($);

    return {
      ticker: googleSymbol,
      peRatio,
      eps,
      error:
        peRatio === null && eps === null
          ? 'Could not find P/E or EPS'
          : undefined,
    };
  } catch (error) {
    return {
      ticker: googleSymbol,
      peRatio: null,
      eps: null,
      error: (error as Error).message,
    };
  }
}

export async function fetchGoogleFinanceData(
  tickers: Array<{ googleSymbol: string; yahooSymbol: string }>,
): Promise<Map<string, GoogleFinanceData>> {
  const results = new Map<string, GoogleFinanceData>();
  const uncached: typeof tickers = [];

  for (const t of tickers) {
    const hit = cache.get<GoogleFinanceData>(`google:${t.googleSymbol}`);
    if (hit) results.set(t.yahooSymbol, hit);
    else uncached.push(t);
  }

  const tasks = uncached.map((t) => async () => {
    // 500–1500ms jitter between requests — without this Google returns 429s
    await delay(500 + Math.random() * 1000);
    const data = await scrapeStock(t.googleSymbol);
    cache.set(`google:${t.googleSymbol}`, data, CACHE_TTL);
    results.set(t.yahooSymbol, data);
  });

  await runWithConcurrency(tasks, CONCURRENCY);
  return results;
}
