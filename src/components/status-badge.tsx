import { Badge } from "@/components/ui/badge";

const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Active: "default",
  Received: "default",
  Paid: "default",
  Approved: "secondary",
  STOCK_RECEIPT: "secondary",
  Pending: "outline",
  Partial: "outline",
  Inactive: "outline",
  STOCK_ISSUE: "destructive",
  ADJUSTMENT: "secondary",
};

const colorMap: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Inactive: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  Pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Approved: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  Received: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Partial: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  STOCK_RECEIPT: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  STOCK_ISSUE: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  ADJUSTMENT: "bg-violet-100 text-violet-800 hover:bg-violet-100",
};

interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const label = typeof value === "string" ? value.replaceAll("_", " ") : value;

  return (
    <Badge
      variant={variantMap[value] || "outline"}
      className={colorMap[value] || ""}
    >
      {label}
    </Badge>
  );
}
