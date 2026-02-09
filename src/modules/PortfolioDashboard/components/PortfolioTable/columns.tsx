import { createColumnHelper } from "@tanstack/react-table";
import type { EnrichedStockRow } from "../../types/portfolio";
import { GainLossCell } from "./GainLossCell";
import { fmt } from "@/common/utils/formatting";

const col = createColumnHelper<EnrichedStockRow>();

export const columns = [
  col.accessor("name", {
    header: "Particulars",
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    size: 160,
  }),
  col.accessor("purchasePrice", {
    header: "Purchase Price",
    cell: (info) => fmt(info.getValue(), "inr-decimal"),
    size: 120,
  }),
  col.accessor("quantity", {
    header: "Qty",
    cell: (info) => info.getValue(),
    size: 60,
  }),
  col.accessor("investment", {
    header: "Investment",
    cell: (info) => fmt(info.getValue()),
    size: 110,
  }),
  col.accessor("portfolioPercent", {
    header: "Portfolio %",
    cell: (info) => fmt(info.getValue(), "percent"),
    size: 90,
  }),
  col.accessor("exchangeCode", {
    header: "NSE/BSE",
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
    size: 100,
  }),
  col.accessor("cmp", {
    header: "CMP",
    cell: (info) => fmt(info.getValue(), "inr-decimal"),
    size: 100,
  }),
  col.accessor("presentValue", {
    header: "Present Value",
    cell: (info) => fmt(info.getValue()),
    size: 120,
  }),
  col.accessor("gainLoss", {
    header: "Gain/Loss",
    cell: (info) => (
      <GainLossCell
        value={info.getValue()}
        percent={info.row.original.gainLossPercent}
      />
    ),
    size: 160,
  }),
  col.accessor("peRatio", {
    header: "P/E Ratio",
    cell: (info) => fmt(info.getValue(), "decimal"),
    size: 90,
  }),
  col.accessor("latestEarnings", {
    header: "Latest Earnings",
    cell: (info) => fmt(info.getValue(), "decimal"),
    size: 110,
  }),
];
