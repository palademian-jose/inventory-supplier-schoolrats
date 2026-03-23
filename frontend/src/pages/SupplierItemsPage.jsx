import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createResource, deleteResource, fetchResource } from "../api/resources";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";

export default function SupplierItemsPage() {
  const [mappings, setMappings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    supplier_id: "",
    item_id: "",
    supplier_price: "",
    lead_time_days: ""
  });

  const loadData = async () => {
    try {
      const [mappingRows, supplierRows, itemRows] = await Promise.all([
        fetchResource("/supplier-items"),
        fetchResource("/suppliers", { page: 1, limit: 100 }),
        fetchResource("/items", { page: 1, limit: 100 })
      ]);
      setMappings(mappingRows);
      setSuppliers(supplierRows.data);
      setItems(itemRows.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load supplier item data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateForm = () => {
    const nextErrors = {};
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the required mapping fields");
      return;
    }

    try {
      await createResource("/supplier-items", {
        supplier_id: Number(form.supplier_id),
        item_id: Number(form.item_id),
        supplier_price: Number(form.supplier_price),
        lead_time_days: Number(form.lead_time_days)
      });
      toast.success("Mapping saved");
      setIsOpen(false);
      setErrors({});
      setForm({ supplier_id: "", item_id: "", supplier_price: "", lead_time_days: "" });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save mapping");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResource("/supplier-items", deleteTarget.id);
      toast.success("Mapping deleted");
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Relationship Setup
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Supplier-Item Mapping
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Assign items to suppliers with price and lead time.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
            Add Mapping
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "supplier_name", label: "Supplier" },
          { key: "item_name", label: "Item" },
          { key: "supplier_price", label: "Supplier Price", render: (row) => `$${Number(row.supplier_price).toFixed(2)}` },
          { key: "lead_time_days", label: "Lead Time (days)" }
        ]}
        rows={mappings}
        emptyState={{
          title: "No supplier mappings yet",
          description: "Connect suppliers to items so procurement can reference supplier price and lead time.",
          action: (
            <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
              Add Mapping
            </button>
          )
        }}
        actions={(row) => (
          <button type="button" className="btn-danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        )}
      />

      <Modal isOpen={isOpen} title="Add Supplier Item Mapping" onClose={() => setIsOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Supplier</label>
            <select
              className={`select ${errors.supplier_id ? "input-error" : ""}`}
              value={form.supplier_id}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, supplier_id: event.target.value }));
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
            <label className="mb-2 block text-sm font-medium text-slate-700">Item</label>
            <select
              className={`select ${errors.item_id ? "input-error" : ""}`}
              value={form.item_id}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, item_id: event.target.value }));
                setErrors((prev) => ({ ...prev, item_id: undefined }));
              }}
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.item_id ? <p className="field-error">{errors.item_id}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Supplier Price</label>
            <input
              className={`input ${errors.supplier_price ? "input-error" : ""}`}
              type="number"
              min="0"
              value={form.supplier_price}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, supplier_price: event.target.value }));
                setErrors((prev) => ({ ...prev, supplier_price: undefined }));
              }}
            />
            {errors.supplier_price ? <p className="field-error">{errors.supplier_price}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Lead Time Days</label>
            <input
              className={`input ${errors.lead_time_days ? "input-error" : ""}`}
              type="number"
              min="0"
              value={form.lead_time_days}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, lead_time_days: event.target.value }));
                setErrors((prev) => ({ ...prev, lead_time_days: undefined }));
              }}
            />
            {errors.lead_time_days ? <p className="field-error">{errors.lead_time_days}</p> : null}
          </div>
          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Mapping"
        message="Delete this supplier-item mapping?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
