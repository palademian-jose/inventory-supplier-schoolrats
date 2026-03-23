import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ResourcePage from "./ResourcePage";
import { fetchResource } from "../api/resources";

export default function ItemsPage() {
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [categoryRows, unitRows] = await Promise.all([
          fetchResource("/master-data/categories"),
          fetchResource("/master-data/units")
        ]);
        setCategories(categoryRows);
        setUnits(unitRows);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load item master data");
      }
    };

    loadMasterData();
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.id),
        label: category.name
      })),
    [categories]
  );

  const unitOptions = useMemo(
    () =>
      units.map((unit) => ({
        value: String(unit.id),
        label: `${unit.name} (${unit.symbol})`
      })),
    [units]
  );

  return (
    <ResourcePage
      title="Items"
      subtitle="Maintain inventory items, normalized categories, units, stock levels, and reorder thresholds."
      endpoint="/items"
      searchPlaceholder="Search items..."
      columns={[
        { key: "name", label: "Item" },
        { key: "category_name", label: "Category", render: (row) => row.category_name || row.category },
        {
          key: "unit_symbol",
          label: "Unit",
          render: (row) => row.unit_symbol || "-"
        },
        {
          key: "price",
          label: "Price",
          render: (row) => `$${Number(row.price).toFixed(2)}`
        },
        {
          key: "stock_quantity",
          label: "Stock",
          render: (row) => (
            <span className={row.is_low_stock ? "font-semibold text-amber-600" : ""}>
              {row.stock_quantity}
            </span>
          )
        },
        { key: "reorder_level", label: "Reorder Level" }
      ]}
      fields={[
        { name: "name", label: "Item Name", required: true },
        {
          name: "category_id",
          label: "Category",
          type: "select",
          required: true,
          options: categoryOptions
        },
        {
          name: "unit_id",
          label: "Unit",
          type: "select",
          options: unitOptions
        },
        { name: "price", label: "Price", type: "number", required: true, min: 0 },
        {
          name: "stock_quantity",
          label: "Stock Quantity",
          type: "number",
          defaultValue: 0,
          required: true,
          min: 0
        },
        {
          name: "reorder_level",
          label: "Reorder Level",
          type: "number",
          defaultValue: 0,
          required: true,
          min: 0
        }
      ]}
      transformForm={(form) => {
        const selectedCategory = categories.find(
          (category) => String(category.id) === String(form.category_id)
        );

        return {
          ...form,
          category: selectedCategory?.name || "",
          category_id: form.category_id ? Number(form.category_id) : null,
          unit_id: form.unit_id ? Number(form.unit_id) : null,
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity),
          reorder_level: Number(form.reorder_level)
        };
      }}
    />
  );
}
