import { holdings } from '@/modules/PortfolioDashboard/data/holdings';
import { fetchYahooQuotes } from '@/modules/PortfolioDashboard/services/yahooFinance';
import { fetchGoogleFinanceData } from '@/modules/PortfolioDashboard/services/googleFinance';
import { aggregatePortfolio } from '@/modules/PortfolioDashboard/utils/aggregate';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const symbols = holdings.map((h) => h.yahooSymbol);
    const googleTickers = holdings.map((h) => ({
      googleSymbol: h.googleSymbol,
      yahooSymbol: h.yahooSymbol,
    }));

    const [yahooData, googleData] = await Promise.all([
      fetchYahooQuotes(symbols),
      fetchGoogleFinanceData(googleTickers),
    ]);

    const portfolio = aggregatePortfolio(holdings, yahooData, googleData);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
