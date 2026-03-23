import ResourcePage from "./ResourcePage";

export default function ItemsPage() {
  return (
    <ResourcePage
      title="Items"
      subtitle="Maintain inventory items, stock levels, and reorder thresholds."
      endpoint="/items"
      searchPlaceholder="Search items..."
      columns={[
        { key: "name", label: "Item" },
        { key: "category", label: "Category" },
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
        { name: "category", label: "Category", required: true },
        { name: "price", label: "Price", type: "number", required: true, min: 0 },
        { name: "stock_quantity", label: "Stock Quantity", type: "number", defaultValue: 0, required: true, min: 0 },
        { name: "reorder_level", label: "Reorder Level", type: "number", defaultValue: 0, required: true, min: 0 }
      ]}
      transformForm={(form) => ({
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        reorder_level: Number(form.reorder_level)
      })}
    />
  );
}
