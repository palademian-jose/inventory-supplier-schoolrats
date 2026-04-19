import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accents = {
  brand: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  alert: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

interface StatCardProps {
  title: string;
  value: string | number;
  accent?: keyof typeof accents;
}

export function StatCard({ title, value, accent = "brand" }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-muted to-transparent" />
      <CardContent className="pt-5">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            accents[accent]
          )}
        >
          {title}
        </span>
        <p className="mt-4 text-4xl font-semibold tracking-tight">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Current snapshot from the inventory database.
        </p>
      </CardContent>
    </Card>
  );
}
