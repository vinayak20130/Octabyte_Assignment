const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrDecimal = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const decimal = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type FmtStyle = "inr" | "inr-decimal" | "percent" | "decimal";

const formatters: Record<FmtStyle, Intl.NumberFormat> = {
  inr,
  "inr-decimal": inrDecimal,
  percent,
  decimal,
};

export function fmt(value: number | null, style: FmtStyle = "inr"): string {
  if (value == null) return "---";
  if (style === "percent") return formatters.percent.format(value / 100);
  return formatters[style].format(value);
}
