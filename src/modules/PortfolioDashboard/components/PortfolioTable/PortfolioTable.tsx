"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type Row,
} from "@tanstack/react-table";
import type { EnrichedStockRow, SectorSummary, Sector } from "../../types/portfolio";
import { columns } from "./columns";
import { SectorGroup } from "./SectorGroup";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";

interface PortfolioTableProps {
  sectors: Array<{ summary: SectorSummary; stocks: EnrichedStockRow[] }>;
}

export function PortfolioTable({ sectors }: PortfolioTableProps) {
  const [expandedSectors, setExpandedSectors] = useState<Set<Sector>>(
    () => new Set(sectors.map((s) => s.summary.sector))
  );

  const allStocks = useMemo(() => sectors.flatMap((s) => s.stocks), [sectors]);

  const table = useReactTable({
    data: allStocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleSector = (sector: Sector) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      next.has(sector) ? next.delete(sector) : next.add(sector);
      return next;
    });
  };

  const rowsBySector = useMemo(() => {
    const map = new Map<Sector, Row<EnrichedStockRow>[]>();
    let idx = 0;
    for (const group of sectors) {
      map.set(
        group.summary.sector,
        table.getRowModel().rows.slice(idx, idx + group.stocks.length)
      );
      idx += group.stocks.length;
    }
    return map;
  }, [sectors, table]);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <Table className="min-w-275">
        <TableHeader>
          <TableRow className="bg-gray-700 hover:bg-gray-700">
            {table.getHeaderGroups()[0].headers.map((header) => (
              <TableHead
                key={header.id}
                className="text-white text-xs font-semibold uppercase tracking-wider px-3 py-3"
                style={{ width: header.getSize() }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sectors.map(({ summary }) => {
            const isExpanded = expandedSectors.has(summary.sector);
            const rows = rowsBySector.get(summary.sector) || [];
            return (
              <SectorGroup
                key={summary.sector}
                summary={summary}
                rows={rows}
                isExpanded={isExpanded}
                onToggle={() => toggleSector(summary.sector)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
