import { fetchYahooQuotes } from '@/src/modules/PortfolioDashboard/services/yahooFinance';
import { NextResponse } from 'next/server';

export async function GET() {
  const results = await fetchYahooQuotes(['HDFCBANK.NS', 'ICICIBANK.NS']);
  return NextResponse.json(Object.fromEntries(results));
}
