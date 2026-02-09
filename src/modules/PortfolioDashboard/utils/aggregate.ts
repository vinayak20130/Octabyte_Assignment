import type {
  StockHolding,
  EnrichedStockRow,
  SectorSummary,
  PortfolioResponse,
  YahooQuoteData,
  GoogleFinanceData,
  Sector,
} from "../types/portfolio";

const SECTOR_ORDER: Sector[] = [
  "Financial",
  "Tech",
  "Consumer",
  "Power",
  "Pipe",
  "Others",
];

// We propagate null (not zero) when market data is missing — a stock with
// no price quote shouldn't silently look like a total loss.
function calcGainLoss(
  presentValue: number | null,
  investment: number
): { gainLoss: number | null; gainLossPercent: number | null } {
  if (presentValue === null) return { gainLoss: null, gainLossPercent: null };
  const gainLoss = presentValue - investment;
  const gainLossPercent = (gainLoss / investment) * 100;
  return { gainLoss, gainLossPercent };
}

// We still show partial totals when some stocks lack price data — null only
// when every single value is missing, so the dashboard stays useful.
function sumNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : null;
}

export function aggregatePortfolio(
  holdings: StockHolding[],
  yahooData: Map<string, YahooQuoteData>,
  googleData: Map<string, GoogleFinanceData>
): PortfolioResponse {
  const errors: string[] = [];

  const totalInvested = holdings.reduce(
    (sum, holding) => sum + holding.purchasePrice * holding.quantity,
    0
  );

  const rows: EnrichedStockRow[] = holdings.map((holding) => {
    const investment = holding.purchasePrice * holding.quantity;
    const yahoo = yahooData.get(holding.yahooSymbol);
    const google = googleData.get(holding.yahooSymbol);
    const stockErrors: string[] = [];

    if (yahoo?.error) stockErrors.push(yahoo.error);
    if (google?.error) stockErrors.push(google.error);

    const cmp = yahoo?.regularMarketPrice ?? null;
    const presentValue = cmp !== null ? cmp * holding.quantity : null;
    const { gainLoss, gainLossPercent } = calcGainLoss(presentValue, investment);

    const portfolioPercent = (investment / totalInvested) * 100;

    // We prefer Google's P/E and EPS because Yahoo's trailing-twelve-months
    // figures lag behind by weeks for Indian stocks.
    const peRatio = google?.peRatio ?? yahoo?.trailingPE ?? null;
    const latestEarnings =
      google?.eps ?? yahoo?.epsTrailingTwelveMonths ?? null;

    return {
      id: holding.id,
      name: holding.name,
      sector: holding.sector,
      purchasePrice: holding.purchasePrice,
      quantity: holding.quantity,
      exchange: holding.exchange,
      exchangeCode: holding.exchangeCode,
      investment,
      cmp,
      presentValue,
      gainLoss,
      gainLossPercent,
      portfolioPercent,
      peRatio,
      latestEarnings,
      hasError: stockErrors.length > 0,
      errorMessages: stockErrors,
    };
  });

  const stockErrors = new Set(rows.flatMap((s) => s.errorMessages));
  errors.push(...stockErrors);

  const sectorMap = new Map<Sector, EnrichedStockRow[]>();
  for (const stock of rows) {
    const list = sectorMap.get(stock.sector) || [];
    list.push(stock);
    sectorMap.set(stock.sector, list);
  }

  const sectors = SECTOR_ORDER.filter((s) => sectorMap.has(s)).map(
    (sector) => {
      const stocks = sectorMap.get(sector)!;
      const totalInvestment = stocks.reduce((sum, stock) => sum + stock.investment, 0);
      const totalPresentValue = sumNullable(stocks.map((stock) => stock.presentValue));
      const { gainLoss, gainLossPercent } = calcGainLoss(totalPresentValue, totalInvestment);

      const summary: SectorSummary = {
        sector,
        stockCount: stocks.length,
        totalInvestment,
        totalPresentValue,
        gainLoss,
        gainLossPercent,
      };

      return { summary, stocks };
    }
  );

  const totalPresentValue = sumNullable(rows.map((stock) => stock.presentValue));
  const { gainLoss: totalGainLoss, gainLossPercent: totalGainLossPercent } =
    calcGainLoss(totalPresentValue, totalInvested);

  return {
    sectors,
    grandTotal: {
      totalInvestment: totalInvested,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent,
    },
    lastUpdated: new Date().toISOString(),
    errors,
  };
}
