"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Item {
  id: number;
  name: string;
}

interface Filters {
  item_id: string;
  type: string;
  start_date: string;
  end_date: string;
}

const emptyFilters: Filters = {
  item_id: "",
  type: "",
  start_date: "",
  end_date: "",
};

const TYPES = ["STOCK_RECEIPT", "STOCK_ISSUE", "ADJUSTMENT"] as const;

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Record<string, unknown> | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });

  const loadData = useCallback(async (params: Filters = emptyFilters) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.item_id) searchParams.set("item_id", params.item_id);
      if (params.type) searchParams.set("type", params.type);
      if (params.start_date) searchParams.set("start_date", params.start_date);
      if (params.end_date) searchParams.set("end_date", params.end_date);

      const [txRes, itemRes] = await Promise.all([
        fetch(`/api/stock-transactions?${searchParams}`),
        fetch("/api/items?page=1&limit=100"),
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItems(data.data);
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = () => loadData(filters);

  const clearFilters = () => {
    const next = { ...emptyFilters };
    setFilters(next);
    loadData(next);
  };

  if (loading && !transactions.length) {
    return <LoadingState label="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Audit Trail"
            title="Stock Transactions"
            description="Filter stock movement by item, date, and transaction type."
          />
        </CardContent>
      </Card>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Select
              value={filters.item_id || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, item_id: val === "all" ? "" : val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.type || "all"}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, type: val === "all" ? "" : val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />

            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, end_date: e.target.value }))
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={[
          { key: "item_name", label: "Item" },
          { key: "transaction_type", label: "Type", type: "status" },
          { key: "quantity", label: "Quantity" },
          { key: "reference_type", label: "Reference" },
          {
            key: "notes",
            label: "Notes",
            render: (row) => {
              const notes = (row.notes as string) || "-";
              return notes.length > 40 ? `${notes.slice(0, 40)}...` : notes;
            },
          },
          {
            key: "transaction_date",
            label: "Date",
            render: (row) => new Date(row.transaction_date as string).toLocaleString(),
          },
        ]}
        rows={transactions}
        emptyTitle="No matching transactions"
        emptyDescription="Try broadening the date range or clearing the filters to view available stock movement history."
        actions={(row) => (
          <Button variant="outline" size="sm" onClick={() => setSelectedTx(row)}>
            View
          </Button>
        )}
      />

      {/* Detail dialog */}
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
