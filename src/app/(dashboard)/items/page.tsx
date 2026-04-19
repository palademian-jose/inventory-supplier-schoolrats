"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ResourcePage } from "@/components/resource-page";

export default function ItemsPage() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string; symbol: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          fetch("/api/master-data/categories"),
          fetch("/api/master-data/units"),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (unitRes.ok) setUnits(await unitRes.json());
      } catch {
        toast.error("Failed to load item master data");
      }
    };
    load();
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  );
  const unitOptions = useMemo(
    () => units.map((u) => ({ value: String(u.id), label: `${u.name} (${u.symbol})` })),
    [units]
  );

  return (
    <ResourcePage
      title="Items"
      subtitle="Maintain inventory items, categories, units, stock levels, and reorder thresholds."
      endpoint="/api/items"
      searchPlaceholder="Search items..."
      columns={[
        { key: "name", label: "Item" },
        { key: "category_name", label: "Category", render: (row) => (row.category_name as string) || "-" },
        { key: "unit_symbol", label: "Unit", render: (row) => (row.unit_symbol as string) || "-" },
        { key: "price", label: "Price", render: (row) => `$${Number(row.price).toFixed(2)}` },
        {
          key: "stock_quantity",
          label: "Stock",
          render: (row) => (
            <span className={row.is_low_stock ? "font-semibold text-amber-600" : ""}>
              {String(row.stock_quantity)}
            </span>
          ),
        },
        { key: "reorder_level", label: "Reorder Level" },
      ]}
      fields={[
        { name: "name", label: "Item Name", required: true },
        { name: "category_id", label: "Category", type: "select", required: true, options: categoryOptions },
        { name: "unit_id", label: "Unit", type: "select", options: unitOptions },
        { name: "price", label: "Price", type: "number", required: true, min: 0, step: "0.01" },
        { name: "stock_quantity", label: "Stock Quantity", type: "number", defaultValue: 0, required: true, min: 0 },
        { name: "reorder_level", label: "Reorder Level", type: "number", defaultValue: 0, required: true, min: 0 },
      ]}
      transformForm={(form) => ({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        unit_id: form.unit_id ? Number(form.unit_id) : null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        reorder_level: Number(form.reorder_level),
      })}
    />
  );
}
