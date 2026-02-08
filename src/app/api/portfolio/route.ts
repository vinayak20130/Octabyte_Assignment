import { holdings } from '@/src/modules/PortfolioDashboard/data/holdings';
import { fetchYahooQuotes } from '@/src/modules/PortfolioDashboard/services/yahooFinance';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const symbols = holdings.map((h) => h.yahooSymbol);
    const yahooData = await fetchYahooQuotes(symbols);

    const stocks = holdings.map((holding) => {
      const yahoo = yahooData.get(holding.yahooSymbol);
      const investment = holding.purchasePrice * holding.quantity;
      const cmp = yahoo?.regularMarketPrice ?? null;
      const presentValue = cmp !== null ? cmp * holding.quantity : null;
      const gainLoss = presentValue !== null ? presentValue - investment : null;
      const gainLossPercent =
        gainLoss !== null ? (gainLoss / investment) * 100 : null;

      return {
        ...holding,
        investment,
        cmp,
        presentValue,
        gainLoss,
        gainLossPercent,
        peRatio: yahoo?.trailingPE ?? null,
        error: yahoo?.error ?? null,
      };
    });

    return NextResponse.json({
      stocks,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
