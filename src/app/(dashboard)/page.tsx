"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardData {
  cards: {
    totalItems: number;
    lowStockItems: number;
    totalSuppliers: number;
    pendingPurchaseOrders: number;
  };
  recentTransactions: Record<string, unknown>[];
}

const detailFields = (tx: Record<string, unknown>) => [
  { label: "Transaction ID", value: tx?.id },
  { label: "Item", value: tx?.item_name },
  { label: "Category", value: (tx?.item_category as string) || "Not specified" },
  { label: "Supplier", value: (tx?.supplier_name as string) || "Not linked" },
  { label: "Unit", value: (tx?.unit_symbol as string) || "Not specified" },
  { label: "User", value: (tx?.user_name as string) || "Not linked" },
  { label: "Recorded By", value: (tx?.created_by_name as string) || "System" },
  { label: "Quantity", value: tx?.quantity },
  { label: "Balance After", value: tx?.balance_after ?? "Not recorded" },
  { label: "Reference Type", value: (tx?.reference_type as string) || "Not specified" },
  { label: "Reference ID", value: tx?.reference_id || "Not specified" },
  {
    label: "Date",
    value: tx?.transaction_date
      ? new Date(tx.transaction_date as string).toLocaleString()
      : "Not specified",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Failed to load dashboard");
        setData(await res.json());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (loading) return <LoadingState label="Loading dashboard..." />;

  if (!data?.cards) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Dashboard unavailable
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Summary data could not be loaded.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check that the database is connected and environment variables are set correctly.
          </p>
        </CardContent>
      </Card>
    );
  }

  const operationalStatus =
    data.cards.lowStockItems > 0
      ? "Immediate attention recommended for low stock coverage."
      : "Stock levels are currently within safe reorder thresholds.";

  const quickActions = [
    { label: "Add Item", href: "/items" },
    { label: "Add Supplier", href: "/suppliers" },
    { label: "Create Purchase Order", href: "/purchase-orders" },
    { label: "Record Stock Issue", href: "/stock-issues" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight">
                Keep the full inventory story visible from stock health to supplier readiness.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Current item counts, low-stock exposure, supplier coverage, and pending procurement.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-lg border bg-muted/50 px-4 py-4 text-sm transition hover:bg-background"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick Action
                    </p>
                    <p className="mt-1.5 text-base font-semibold">{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-lg border bg-muted/50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Operational Status
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {data.cards.lowStockItems} item{data.cards.lowStockItems === 1 ? "" : "s"} below
                  reorder threshold
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{operationalStatus}</p>
              </div>
              <div className="grid gap-3 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between rounded-md bg-background px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Suppliers tracked</span>
                  <span className="text-lg font-semibold">{data.cards.totalSuppliers}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-background px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Pending purchase orders</span>
                  <span className="text-lg font-semibold">{data.cards.pendingPurchaseOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Items" value={data.cards.totalItems} />
        <StatCard title="Low Stock Items" value={data.cards.lowStockItems} accent="alert" />
        <StatCard title="Total Suppliers" value={data.cards.totalSuppliers} accent="neutral" />
        <StatCard title="Pending POs" value={data.cards.pendingPurchaseOrders} accent="brand" />
      </section>

      {/* Recent transactions */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Recent Stock Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest purchase and issue activity.</p>
        </div>
        <DataTable
          columns={[
            { key: "item_name", label: "Item" },
            { key: "transaction_type", label: "Type", type: "status" },
            { key: "quantity", label: "Quantity" },
            {
              key: "transaction_date",
              label: "Date",
              render: (row) => new Date(row.transaction_date as string).toLocaleString(),
            },
          ]}
          rows={data.recentTransactions}
          actions={(row) => (
            <Button variant="outline" size="sm" onClick={() => setSelectedTx(row)}>
              View
            </Button>
          )}
          emptyTitle="No transactions yet"
          emptyDescription="Create a purchase order or record a stock issue to see activity here."
        />
      </section>

      {/* Transaction detail dialog */}
      <Dialog open={Boolean(selectedTx)} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Transaction Type
                  </p>
                  <div className="mt-2">
                    <StatusBadge value={selectedTx.transaction_type as string} />
                  </div>
                </div>
                <div className="md:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {(selectedTx.notes as string) || "No notes recorded."}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {detailFields(selectedTx).map((row) => (
                  <div key={row.label} className="rounded-lg border bg-muted/50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-1.5 text-sm font-medium">{String(row.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
