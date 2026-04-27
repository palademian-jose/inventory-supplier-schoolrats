"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Minus } from "lucide-react";

/* ---------- types ---------- */

interface Supplier {
  id: number;
  name: string;
}

interface SupplierCatalogItem {
  item_id: number;
  item_name: string;
  supplier_price: number;
}

interface OrderLine {
  item_id: string;
  quantity: string;
  unit_price: string;
}

interface POForm {
  supplier_id: string;
  status: string;
  expected_delivery_date: string;
  notes: string;
  items: OrderLine[];
}

interface OrderDetail {
  id: number;
  supplier_id: number;
  order_number: string;
  supplier_name: string;
  status: string;
  total_amount: number;
  created_by_name: string;
  approved_by_name: string;
  expected_delivery_date: string | null;
  approved_at: string | null;
  received_at: string | null;
  notes: string;
  details: Record<string, unknown>[];
}

/* ---------- constants ---------- */

const emptyLine: OrderLine = { item_id: "", quantity: "1", unit_price: "0" };

const emptyForm: POForm = {
  supplier_id: "",
  status: "Pending",
  expected_delivery_date: "",
  notes: "",
  items: [{ ...emptyLine }],
};

/* ---------- component ---------- */

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierItems, setSupplierItems] = useState<SupplierCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<POForm>({ ...emptyForm, items: [{ ...emptyLine }] });

  /* auto-calculated total */
  const total = useMemo(
    () =>
      form.items.reduce(
        (sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0),
        0
      ),
    [form.items]
  );

  /* load orders + suppliers */
  const loadData = useCallback(async () => {
    try {
      const [orderRes, supplierRes] = await Promise.all([
        fetch("/api/purchase-orders"),
        fetch("/api/suppliers?page=1&limit=100"),
      ]);
      if (orderRes.ok) setOrders(await orderRes.json());
      if (supplierRes.ok) {
        const data = await supplierRes.json();
        setSuppliers(data.data);
      }
    } catch {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* load supplier catalog items when supplier changes */
  useEffect(() => {
    if (!form.supplier_id) {
      setSupplierItems([]);
      return;
    }
    const loadItems = async () => {
      try {
        const res = await fetch(`/api/suppliers/${form.supplier_id}/items`);
        if (res.ok) setSupplierItems(await res.json());
        else setSupplierItems([]);
      } catch {
        setSupplierItems([]);
        toast.error("Failed to load supplier catalog items");
      }
    };
    loadItems();
  }, [form.supplier_id]);

  /* ---- line helpers ---- */
  const updateLine = (index: number, key: keyof OrderLine, value: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, i) =>
        i === index ? { ...line, [key]: value } : line
      ),
    }));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const catalogItem = supplierItems.find(
      (si) => String(si.item_id) === String(itemId)
    );
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, i) =>
        i === index
          ? {
              ...line,
              item_id: itemId,
              unit_price:
                itemId && catalogItem
                  ? String(Number(catalogItem.supplier_price))
                  : emptyLine.unit_price,
            }
          : line
      ),
    }));
  };

  const setSupplier = (supplierId: string) => {
    setForm((prev) => ({
      ...prev,
      supplier_id: supplierId,
      items: [{ ...emptyLine }],
    }));
  };

  /* ---- validation ---- */
  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.supplier_id) nextErrors.supplier_id = "Supplier is required";

    form.items.forEach((line, index) => {
      if (!line.item_id) nextErrors[`item_id_${index}`] = "Item is required";
      if (!line.quantity || Number(line.quantity) <= 0)
        nextErrors[`quantity_${index}`] = "Quantity must be greater than zero";
      if (line.unit_price === "" || Number(line.unit_price) < 0)
        nextErrors[`unit_price_${index}`] = "Unit price must be zero or greater";
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ---- create ---- */
  const buildPayload = () => ({
    ...form,
    supplier_id: Number(form.supplier_id),
    expected_delivery_date: form.expected_delivery_date || null,
    items: form.items.map((line) => ({
      item_id: Number(line.item_id),
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
    })),
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the purchase order form");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to create purchase order");
      }

      toast.success("Purchase order created");
      setCreateOpen(false);
      setErrors({});
      setForm({ ...emptyForm, items: [{ ...emptyLine }] });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create purchase order");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingOrderId) return;
    if (!validateForm()) {
      toast.error("Please complete the purchase order form");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/purchase-orders/${editingOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to update purchase order");
      }

      toast.success("Purchase order updated");
      setCreateOpen(false);
      setEditingOrderId(null);
      setErrors({});
      setForm({ ...emptyForm, items: [{ ...emptyLine }] });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update purchase order");
    } finally {
      setSaving(false);
    }
  };

  /* ---- status workflow ---- */
  const changeStatus = async (row: Record<string, unknown>, status: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${row.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Status update failed");
      }
      toast.success("Purchase order status updated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  };

  /* ---- view detail ---- */
  const viewOrder = async (row: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/purchase-orders/${row.id}`);
      if (!res.ok) throw new Error("Failed to load purchase order details");
      setSelectedOrder(await res.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load order details");
    }
  };

  const editOrder = async (row: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/purchase-orders/${row.id}`);
      if (!res.ok) throw new Error("Failed to load purchase order details");
      const order = (await res.json()) as OrderDetail;

      if (order.status === "Received") {
        throw new Error("Received purchase orders cannot be edited");
      }

      setEditingOrderId(order.id);
      setForm({
        supplier_id: String(order.supplier_id),
        status: order.status,
        expected_delivery_date: order.expected_delivery_date?.slice(0, 10) || "",
        notes: order.notes || "",
        items: order.details.map((detail) => ({
          item_id: String(detail.item_id ?? ""),
          quantity: String(detail.quantity ?? ""),
          unit_price: String(detail.unit_price ?? ""),
        })),
      });
      setErrors({});
      setCreateOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to edit purchase order");
    }
  };

  const deleteOrder = async (row: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/purchase-orders/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to delete purchase order");
      }

      toast.success("Purchase order deleted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete purchase order");
    }
  };

  if (loading) return <LoadingState label="Loading purchase orders..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Procurement Flow"
            title="Purchase Orders"
            description="Create simple purchase orders with multiple items."
            actions={
              <Button onClick={() => { setEditingOrderId(null); setForm({ ...emptyForm, items: [{ ...emptyLine }] }); setErrors({}); setCreateOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Purchase Order
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Orders table */}
      <DataTable
        columns={[
          { key: "order_number", label: "Order Number" },
          { key: "supplier_name", label: "Supplier" },
          { key: "status", label: "Status", type: "status" },
          {
            key: "expected_delivery_date",
            label: "Expected",
            render: (row) =>
              row.expected_delivery_date
                ? new Date(row.expected_delivery_date as string).toLocaleDateString()
                : "-",
          },
          {
            key: "total_amount",
            label: "Total",
            render: (row) => `$${Number(row.total_amount).toFixed(2)}`,
          },
          {
            key: "order_date",
            label: "Date",
            render: (row) => new Date(row.order_date as string).toLocaleDateString(),
          },
        ]}
        rows={orders}
        emptyTitle="No purchase orders yet"
        emptyDescription="Create a purchase order to demonstrate supplier procurement and stock receipt flow."
        emptyAction={
          <Button onClick={() => { setEditingOrderId(null); setForm({ ...emptyForm, items: [{ ...emptyLine }] }); setErrors({}); setCreateOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Purchase Order
          </Button>
        }
        actions={(row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => viewOrder(row)}>
              View
            </Button>
            {user?.role === "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => editOrder(row)}
                disabled={row.status === "Received"}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeStatus(row, "Approved")}
              disabled={row.status !== "Pending"}
            >
              Approve
            </Button>
            <Button
              size="sm"
              onClick={() => changeStatus(row, "Received")}
              disabled={row.status === "Received"}
            >
              Receive
            </Button>
            {user?.role === "admin" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteOrder(row)}
                disabled={row.status === "Received"}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      />

      {/* ---- Create PO Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrderId ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
          </DialogHeader>

          <form className="space-y-5" onSubmit={editingOrderId ? handleUpdate : handleCreate}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Order Setup
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select the supplier, define the order status, then add one or more item lines with
                quantity and unit price.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Supplier */}
              <div>
                <Label className="mb-1.5">
                  Supplier <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.supplier_id}
                  onValueChange={(val) => {
                    setSupplier(val);
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

              {/* Status */}
              <div>
                <Label className="mb-1.5">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Pending", "Approved", "Received"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Delivery */}
              <div>
                <Label className="mb-1.5">Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={form.expected_delivery_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* ---- Line items ---- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Order Items</p>
                  <p className="text-sm text-muted-foreground">
                    Each row represents one catalog item offered by the selected supplier.
                  </p>
                </div>
              </div>

              {form.items.map((line, index) => (
                <div key={index} className="space-y-4 rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Item Line {index + 1}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          items:
                            prev.items.length === 1
                              ? [{ ...emptyLine }]
                              : prev.items.filter((_, i) => i !== index),
                        }))
                      }
                      disabled={form.items.length === 1}
                    >
                      <Minus className="mr-1 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Item select */}
                    <div>
                      <Label className="mb-1.5">
                        Item <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={line.item_id}
                        onValueChange={(val) => {
                          handleItemChange(index, val);
                          setErrors((prev) => ({ ...prev, [`item_id_${index}`]: "" }));
                        }}
                        disabled={!form.supplier_id || supplierItems.length === 0}
                      >
                        <SelectTrigger
                          className={errors[`item_id_${index}`] ? "border-destructive" : ""}
                        >
                          <SelectValue
                            placeholder={
                              !form.supplier_id
                                ? "Select supplier first"
                                : supplierItems.length === 0
                                  ? "No supplier catalog items"
                                  : "Select item"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierItems.map((si) => (
                            <SelectItem key={si.item_id} value={String(si.item_id)}>
                              {si.item_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`item_id_${index}`] && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors[`item_id_${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label className="mb-1.5">
                        Quantity <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Enter quantity"
                        className={errors[`quantity_${index}`] ? "border-destructive" : ""}
                        value={line.quantity}
                        onChange={(e) => {
                          updateLine(index, "quantity", e.target.value);
                          setErrors((prev) => ({ ...prev, [`quantity_${index}`]: "" }));
                        }}
                      />
                      {errors[`quantity_${index}`] && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors[`quantity_${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div>
                      <Label className="mb-1.5">
                        Unit Price <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Enter unit price"
                        className={errors[`unit_price_${index}`] ? "border-destructive" : ""}
                        value={line.unit_price}
                        onChange={(e) => {
                          updateLine(index, "unit_price", e.target.value);
                          setErrors((prev) => ({ ...prev, [`unit_price_${index}`]: "" }));
                        }}
                      />
                      {errors[`unit_price_${index}`] && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors[`unit_price_${index}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                disabled={!form.supplier_id || supplierItems.length === 0}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    items: [...prev.items, { ...emptyLine }],
                  }))
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Item Line
              </Button>
            </div>

            {/* Notes */}
            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea
                className="min-h-24"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-4">
              <span className="font-medium text-muted-foreground">Auto-calculated total</span>
              <span className="text-xl font-semibold">${total.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditingOrderId(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (editingOrderId ? "Saving..." : "Creating...") : (editingOrderId ? "Save Changes" : "Create Order")}
                </Button>
              </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Order detail dialog ---- */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder
                ? `Purchase Order ${selectedOrder.order_number}`
                : "Purchase Order"}
            </DialogTitle>
            <DialogDescription>
              Review supplier, approval, and line item details for this order.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order Number
                  </p>
                  <p className="mt-2 text-base font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge value={selectedOrder.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Amount
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    ${Number(selectedOrder.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.supplier_name}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Created By
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.created_by_name || "-"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Approved By
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.approved_by_name || "-"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Expected Delivery
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.expected_delivery_date
                      ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Approved At
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.approved_at
                      ? new Date(selectedOrder.approved_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Received At
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedOrder.received_at
                      ? new Date(selectedOrder.received_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium">
                    {selectedOrder.notes || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Line Items</p>
                  <p className="text-sm text-muted-foreground">
                    Ordered quantities, received quantities, and pricing for this purchase order.
                  </p>
                </div>
                <DataTable
                  columns={[
                    { key: "item_name", label: "Item" },
                    { key: "item_category", label: "Category" },
                    {
                      key: "unit_symbol",
                      label: "Unit",
                      render: (row) => (row.unit_symbol as string) || "-",
                    },
                    { key: "quantity", label: "Ordered" },
                    { key: "received_quantity", label: "Received" },
                    {
                      key: "unit_price",
                      label: "Unit Price",
                      render: (row) => `$${Number(row.unit_price).toFixed(2)}`,
                    },
                    {
                      key: "line_total",
                      label: "Line Total",
                      render: (row) => `$${Number(row.line_total).toFixed(2)}`,
                    },
                    {
                      key: "remarks",
                      label: "Remarks",
                      render: (row) => (row.remarks as string) || "-",
                    },
                  ]}
                  rows={selectedOrder.details}
                  emptyTitle="No line items"
                  emptyDescription="This purchase order has no saved line items."
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
