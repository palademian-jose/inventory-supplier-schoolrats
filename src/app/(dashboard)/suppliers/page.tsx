"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResourcePage } from "@/components/resource-page";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SuppliersPage() {
  const [catalogItems, setCatalogItems] = useState<Record<string, unknown>[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Record<string, unknown> | null>(null);

  const viewItems = async (supplier: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/items`);
      if (!res.ok) throw new Error("Failed to load catalog");
      setCatalogItems(await res.json());
      setSelectedSupplier(supplier);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load supplier catalog");
    }
  };

  return (
    <>
      <ResourcePage
        title="Suppliers"
        subtitle="Track supplier contacts and procurement partners."
        endpoint="/api/suppliers"
        searchPlaceholder="Search suppliers..."
        columns={[
          { key: "name", label: "Supplier" },
          { key: "contact_person", label: "Contact Person" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "address", label: "Address" },
        ]}
        rowActions={(row) => (
          <Button variant="outline" size="sm" onClick={() => viewItems(row)}>
            View Catalog
          </Button>
        )}
        fields={[
          { name: "name", label: "Supplier Name", required: true },
          { name: "contact_person", label: "Contact Person" },
          { name: "phone", label: "Phone", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "address", label: "Address", fullWidth: true, type: "textarea" },
        ]}
      />

      <Dialog
        open={Boolean(selectedSupplier)}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Supplier Catalog{selectedSupplier ? ` - ${selectedSupplier.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <DataTable
            columns={[
              { key: "item_name", label: "Item" },
              { key: "supplier_sku", label: "SKU", render: (row) => (row.supplier_sku as string) || "-" },
              { key: "is_preferred", label: "Preferred", render: (row) => (row.is_preferred ? "Yes" : "No") },
              {
                key: "supplier_price",
                label: "Price",
                render: (row) => `$${Number(row.supplier_price).toFixed(2)}`,
              },
              { key: "lead_time_days", label: "Lead Time (days)" },
            ]}
            rows={catalogItems}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
