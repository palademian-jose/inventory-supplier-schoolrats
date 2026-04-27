"use client";

import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

const reports = [
  {
    type: "inventory-summary",
    title: "Inventory Summary",
    description: "PDF overview of total items, low stock exposure, and current stock snapshot.",
  },
  {
    type: "low-stock",
    title: "Low Stock Report",
    description: "PDF list of items that have reached or gone below reorder level.",
  },
  {
    type: "transaction-history",
    title: "Transaction History",
    description: "PDF report of recent stock receipts and stock issues for audit presentation.",
  },
] as const;

export default function ReportsPage() {
  const downloadReport = async (type: string) => {
    try {
      const res = await fetch(`/api/reports/stock?type=${type}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to generate report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type}-report.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Reporting Module"
            title="Reports"
            description="Generate ready-to-download PDF reports for stock status and recent inventory activity."
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.type}>
            <CardContent className="flex h-full flex-col pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PDF Export
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{report.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                {report.description}
              </p>
              <Button className="mt-6" onClick={() => downloadReport(report.type)}>
                Generate PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
