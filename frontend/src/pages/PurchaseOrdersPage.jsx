import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createResource, fetchResource, patchResource } from "../api/resources";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PurchaseOrderDetailsModal from "../components/PurchaseOrderDetailsModal";

const emptyLine = { item_id: "", quantity: 1, unit_price: 0 };

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierItems, setSupplierItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    supplier_id: "",
    status: "Pending",
    expected_delivery_date: "",
    notes: "",
    items: [emptyLine]
  });

  const total = useMemo(
    () =>
      form.items.reduce(
        (sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0),
        0
      ),
    [form.items]
  );

  const loadData = async () => {
    try {
      const [orderRows, supplierRows] = await Promise.all([
        fetchResource("/purchase-orders"),
        fetchResource("/suppliers", { page: 1, limit: 100 })
      ]);
      setOrders(orderRows);
      setSuppliers(supplierRows.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load purchase orders");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadSupplierItems = async () => {
      if (!form.supplier_id) {
        setSupplierItems([]);
        return;
      }

      try {
        const rows = await fetchResource(`/suppliers/${form.supplier_id}/items`);
        setSupplierItems(rows);
      } catch (error) {
        setSupplierItems([]);
        toast.error(error.response?.data?.message || "Failed to load supplier catalog items");
      }
    };

    loadSupplierItems();
  }, [form.supplier_id]);

  const updateLine = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line
      )
    }));
  };

  const setSupplier = (supplierId) => {
    setForm((prev) => ({
      ...prev,
      supplier_id: supplierId,
      items: [{ ...emptyLine }]
    }));
  };

  const handleItemChange = (index, itemId) => {
    const selectedSupplierItem = supplierItems.find(
      (supplierItem) => String(supplierItem.item_id) === String(itemId)
    );

    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              item_id: itemId,
              unit_price:
                itemId && selectedSupplierItem
                  ? Number(selectedSupplierItem.supplier_price)
                  : emptyLine.unit_price
            }
          : line
      )
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.supplier_id) {
      nextErrors.supplier_id = "Supplier is required";
    }

    form.items.forEach((line, index) => {
      if (!line.item_id) {
        nextErrors[`item_id_${index}`] = "Item is required";
      }
      if (!line.quantity || Number(line.quantity) <= 0) {
        nextErrors[`quantity_${index}`] = "Quantity must be greater than zero";
      }
      if (line.unit_price === "" || Number(line.unit_price) < 0) {
        nextErrors[`unit_price_${index}`] = "Unit price must be zero or greater";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the purchase order form");
      return;
    }

    try {
      await createResource("/purchase-orders", {
        ...form,
        supplier_id: Number(form.supplier_id),
        expected_delivery_date: form.expected_delivery_date || null,
        items: form.items.map((line) => ({
          item_id: Number(line.item_id),
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price)
        }))
      });
      toast.success("Purchase order created");
      setIsOpen(false);
      setErrors({});
      setForm({
        supplier_id: "",
        status: "Pending",
        expected_delivery_date: "",
        notes: "",
        items: [emptyLine]
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create purchase order");
    }
  };

  const changeStatus = async (row, status) => {
    try {
      await patchResource("/purchase-orders", `${row.id}/status`, { status });
      toast.success("Purchase order status updated");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  };

  const viewOrder = async (row) => {
    try {
      const order = await fetchResource(`/purchase-orders/${row.id}`);
      setSelectedOrder(order);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load purchase order details");
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Procurement Flow
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Purchase Orders
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create simple purchase orders with multiple items.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
            New Purchase Order
          </button>
        </div>
      </div>

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
                ? new Date(row.expected_delivery_date).toLocaleDateString()
                : "-"
          },
          { key: "total_amount", label: "Total", render: (row) => `$${Number(row.total_amount).toFixed(2)}` },
          { key: "order_date", label: "Date", render: (row) => new Date(row.order_date).toLocaleDateString() }
        ]}
        rows={orders}
        emptyState={{
          title: "No purchase orders yet",
          description: "Create a purchase order to demonstrate supplier procurement and stock receipt flow.",
          action: (
            <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
              New Purchase Order
            </button>
          )
        }}
        actions={(row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => viewOrder(row)}>
              View
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => changeStatus(row, "Approved")}
              disabled={row.status !== "Pending"}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => changeStatus(row, "Received")}
              disabled={row.status === "Received"}
            >
              Receive
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isOpen}
        title="Create Purchase Order"
        onClose={() => setIsOpen(false)}
        eyebrow="Procurement Form"
        maxWidth="max-w-4xl"
      >
        <form className="space-y-5" onSubmit={handleCreate}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Order Setup
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select the supplier, define the order status, then add one or more item lines with quantity and unit price.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                className={`select ${errors.supplier_id ? "input-error" : ""}`}
                value={form.supplier_id}
                onChange={(event) => {
                  setSupplier(event.target.value);
                  setErrors((prev) => ({ ...prev, supplier_id: undefined }));
                }}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id ? <p className="field-error">{errors.supplier_id}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {["Pending", "Approved", "Received"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Expected Delivery Date
              </label>
              <input
                className="input"
                type="date"
                value={form.expected_delivery_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, expected_delivery_date: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Order Items</p>
                <p className="text-sm text-slate-500">
                  Each row represents one catalog item offered by the selected supplier.
                </p>
              </div>
            </div>
            {form.items.map((line, index) => (
              <div key={index} className="card-muted space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Item Line {index + 1}</p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        items: prev.items.filter((_, lineIndex) => lineIndex !== index) || [emptyLine]
                      }))
                    }
                    disabled={form.items.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`select ${errors[`item_id_${index}`] ? "input-error" : ""}`}
                      value={line.item_id}
                      disabled={!form.supplier_id || supplierItems.length === 0}
                      onChange={(event) => {
                        handleItemChange(index, event.target.value);
                        setErrors((prev) => ({ ...prev, [`item_id_${index}`]: undefined }));
                      }}
                    >
                      <option value="">
                        {!form.supplier_id
                          ? "Select supplier first"
                          : supplierItems.length === 0
                            ? "No supplier catalog items"
                            : "Select item"}
                      </option>
                      {supplierItems.map((item) => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.item_name}
                        </option>
                      ))}
                    </select>
                    {errors[`item_id_${index}`] ? (
                      <p className="field-error">{errors[`item_id_${index}`]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`input ${errors[`quantity_${index}`] ? "input-error" : ""}`}
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={line.quantity}
                      onChange={(event) => {
                        updateLine(index, "quantity", event.target.value);
                        setErrors((prev) => ({ ...prev, [`quantity_${index}`]: undefined }));
                      }}
                    />
                    {errors[`quantity_${index}`] ? (
                      <p className="field-error">{errors[`quantity_${index}`]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Unit Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`input ${errors[`unit_price_${index}`] ? "input-error" : ""}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter unit price"
                      value={line.unit_price}
                      onChange={(event) => {
                        updateLine(index, "unit_price", event.target.value);
                        setErrors((prev) => ({ ...prev, [`unit_price_${index}`]: undefined }));
                      }}
                    />
                    {errors[`unit_price_${index}`] ? (
                      <p className="field-error">{errors[`unit_price_${index}`]}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary"
              disabled={!form.supplier_id || supplierItems.length === 0}
              onClick={() =>
                setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyLine }] }))
              }
            >
              Add Item Line
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="input min-h-24"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>

          <div className="card-muted flex items-center justify-between px-4 py-4">
            <span className="font-medium text-slate-700">Auto-calculated total</span>
            <span className="text-xl font-semibold text-slate-900">${total.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Order
            </button>
          </div>
        </form>
      </Modal>

      <PurchaseOrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
