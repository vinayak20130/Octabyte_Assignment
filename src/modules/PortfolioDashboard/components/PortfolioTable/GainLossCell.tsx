import { fmt } from "@/common/utils/formatting";
import { Badge } from "@/components/ui/badge";

interface GainLossCellProps {
  value: number | null;
  percent?: number | null;
}

export function GainLossCell({
  value,
  percent,
}: GainLossCellProps) {
  if (value == null) return <span className="text-gray-400">---</span>;

  const isPositive = value >= 0;

  return (
    <Badge variant={isPositive ? "gain" : "loss"} className="text-sm">
      {isPositive ? "+" : ""}
      {fmt(value)}
      {percent != null && (
        <span className="ml-1 text-xs opacity-75">
          ({fmt(percent, "percent")})
        </span>
      )}
    </Badge>
  );
}
