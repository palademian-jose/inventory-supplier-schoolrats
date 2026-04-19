"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;
}

interface CatalogEntry {
  supplier_id: number;
  item_id: number;
  supplier_name: string;
  item_name: string;
  supplier_sku: string;
  is_preferred: boolean;
  supplier_price: number;
  lead_time_days: number;
}

const emptyForm = {
  supplier_id: "",
  item_id: "",
  supplier_sku: "",
  is_preferred: false,
  supplier_price: "",
  lead_time_days: "",
};

export default function SupplierCatalogPage() {
  const [mappings, setMappings] = useState<CatalogEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogEntry | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    try {
      const [catalogRes, supplierRes, itemRes] = await Promise.all([
        fetch("/api/supplier-catalog"),
        fetch("/api/suppliers?page=1&limit=100"),
        fetch("/api/items?page=1&limit=100"),
      ]);

      if (catalogRes.ok) setMappings(await catalogRes.json());
      if (supplierRes.ok) {
        const data = await supplierRes.json();
        setSuppliers(data.data);
      }
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItems(data.data);
      }
    } catch {
      toast.error("Failed to load supplier catalog data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.supplier_id) nextErrors.supplier_id = "Supplier is required";
    if (!form.item_id) nextErrors.item_id = "Item is required";
    if (form.supplier_price === "" || Number(form.supplier_price) < 0) {
      nextErrors.supplier_price = "Supplier price must be zero or greater";
    }
    if (form.lead_time_days === "" || Number(form.lead_time_days) < 0) {
      nextErrors.lead_time_days = "Lead time must be zero or greater";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the required mapping fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/supplier-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: Number(form.supplier_id),
          item_id: Number(form.item_id),
          supplier_sku: form.supplier_sku || null,
          is_preferred: Boolean(form.is_preferred),
          supplier_price: Number(form.supplier_price),
          lead_time_days: Number(form.lead_time_days),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to save supplier catalog entry");
      }

      toast.success("Catalog entry saved");
      setModalOpen(false);
      setErrors({});
      setForm({ ...emptyForm });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save supplier catalog entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/supplier-catalog/${deleteTarget.supplier_id}/${deleteTarget.item_id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Catalog entry deleted");
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  if (loading) return <LoadingState label="Loading supplier catalog..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Procurement Master Data"
            title="Supplier Catalog"
            description="Define which items each supplier can provide, including price and lead time."
            actions={
              <Button onClick={() => { setForm({ ...emptyForm }); setErrors({}); setModalOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Catalog Entry
              </Button>
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Catalog Entries
              </p>
              <p className="mt-1.5 text-xl font-semibold">{mappings.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Suppliers
              </p>
              <p className="mt-1.5 text-xl font-semibold">{suppliers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={[
          { key: "supplier_name", label: "Supplier" },
          { key: "item_name", label: "Item" },
          {
            key: "supplier_sku",
            label: "Supplier SKU",
            render: (row) => (row.supplier_sku as string) || "-",
          },
          {
            key: "is_preferred",
            label: "Preferred",
            render: (row) => (row.is_preferred ? "Yes" : "No"),
          },
          {
            key: "supplier_price",
            label: "Supplier Price",
            render: (row) => `$${Number(row.supplier_price).toFixed(2)}`,
          },
          { key: "lead_time_days", label: "Lead Time (days)" },
        ]}
        rows={mappings as unknown as Record<string, unknown>[]}
        emptyTitle="No supplier catalog entries yet"
        emptyDescription="Link suppliers to the items they can provide so purchasing can reference vendor pricing and lead time."
        emptyAction={
          <Button onClick={() => { setForm({ ...emptyForm }); setErrors({}); setModalOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Catalog Entry
          </Button>
        }
        actions={(row) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget(row as unknown as CatalogEntry)}
          >
            Delete
          </Button>
        )}
      />

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Supplier Catalog Entry</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <Label className="mb-1.5">Supplier</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, supplier_id: val }));
                  setErrors((prev) => ({ ...prev, supplier_id: "" }));
                }}
              >
                <SelectTrigger className={errors.supplier_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <p className="mt-1 text-xs text-destructive">{errors.supplier_id}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Item</Label>
              <Select
                value={form.item_id}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, item_id: val }));
                  setErrors((prev) => ({ ...prev, item_id: "" }));
                }}
              >
                <SelectTrigger className={errors.item_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.item_id && (
                <p className="mt-1 text-xs text-destructive">{errors.item_id}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Supplier Price</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className={errors.supplier_price ? "border-destructive" : ""}
                value={form.supplier_price}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, supplier_price: e.target.value }));
                  setErrors((prev) => ({ ...prev, supplier_price: "" }));
                }}
              />
              {errors.supplier_price && (
                <p className="mt-1 text-xs text-destructive">{errors.supplier_price}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Supplier SKU</Label>
              <Input
                value={form.supplier_sku}
                onChange={(e) => setForm((prev) => ({ ...prev, supplier_sku: e.target.value }))}
              />
            </div>

            <div>
              <Label className="mb-1.5">Lead Time Days</Label>
              <Input
                type="number"
                min={0}
                className={errors.lead_time_days ? "border-destructive" : ""}
                value={form.lead_time_days}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, lead_time_days: e.target.value }));
                  setErrors((prev) => ({ ...prev, lead_time_days: "" }));
                }}
              />
              {errors.lead_time_days && (
                <p className="mt-1 text-xs text-destructive">{errors.lead_time_days}</p>
              )}
            </div>

            <div className="flex items-center gap-3 md:col-span-2">
              <Checkbox
                id="is_preferred"
                checked={form.is_preferred as boolean}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_preferred: Boolean(checked) }))
                }
              />
              <Label htmlFor="is_preferred" className="cursor-pointer">
                Preferred supplier for this item
              </Label>
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Catalog Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this supplier catalog entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
