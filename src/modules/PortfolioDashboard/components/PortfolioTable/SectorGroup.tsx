import { memo } from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import type { EnrichedStockRow, SectorSummary } from "../../types/portfolio";
import { GainLossCell } from "./GainLossCell";
import { fmt } from "@/common/utils/formatting";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectorGroupProps {
  summary: SectorSummary;
  rows: Row<EnrichedStockRow>[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const SectorGroup = memo(function SectorGroup({
  summary,
  rows,
  isExpanded,
  onToggle,
}: SectorGroupProps) {
  return (
    <>
      <TableRow
        className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        <TableCell colSpan={3} className="px-4 py-3 font-semibold text-gray-800">
          <span className="inline-flex items-center gap-1.5">
            {isExpanded
              ? <ChevronDown className="size-4 text-gray-500" />
              : <ChevronRight className="size-4 text-gray-500" />
            }
            {summary.sector} Sector
            <span className="text-xs font-normal text-gray-500">
              ({summary.stockCount} stocks)
            </span>
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 text-sm font-medium text-gray-700">
          {fmt(summary.totalInvestment)}
        </TableCell>
        <TableCell className="px-3 py-3" />
        <TableCell className="px-3 py-3" />
        <TableCell className="px-3 py-3" />
        <TableCell className="px-3 py-3 text-sm font-medium text-gray-700">
          {fmt(summary.totalPresentValue)}
        </TableCell>
        <TableCell className="px-3 py-3">
          <GainLossCell value={summary.gainLoss} percent={summary.gainLossPercent} />
        </TableCell>
        <TableCell className="px-3 py-3" />
        <TableCell className="px-3 py-3" />
      </TableRow>
      {isExpanded && rows.map((row) => (
        <TableRow
          key={row.id}
          className={cn(
            "border-b border-gray-100 hover:bg-gray-50 transition-colors",
            row.original.hasError && "border-l-2 border-l-amber-400"
          )}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id} className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
});
