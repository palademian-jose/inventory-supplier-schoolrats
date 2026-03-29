import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createResource, fetchResource } from "../api/resources";

export default function IssueItemsPage() {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    user_id: "",
    item_id: "",
    quantity: 1,
    notes: ""
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [userRows, itemRows] = await Promise.all([
          fetchResource("/users", { page: 1, limit: 100 }),
          fetchResource("/items", { page: 1, limit: 100 })
        ]);
        setUsers(userRows.data);
        setItems(itemRows.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load stock issue form");
      }
    };

    loadOptions();
  }, []);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.user_id) nextErrors.user_id = "User is required";
    if (!form.item_id) nextErrors.item_id = "Item is required";
    if (!form.quantity || Number(form.quantity) <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the issue form");
      return;
    }

    try {
      await createResource("/stock-issues", {
        user_id: Number(form.user_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        notes: form.notes
      });
      toast.success("Stock issued successfully");
      setErrors({});
      setForm({ user_id: "", item_id: "", quantity: 1, notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to issue stock");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Internal Fulfillment
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Record a Stock Issue
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select the user, choose an item, and record the quantity issued.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">User</label>
            <select
              className={`select ${errors.user_id ? "input-error" : ""}`}
              value={form.user_id}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, user_id: event.target.value }));
                setErrors((prev) => ({ ...prev, user_id: undefined }));
              }}
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
            {errors.user_id ? <p className="field-error">{errors.user_id}</p> : null}
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
                  {item.name} (Stock: {item.stock_quantity})
                </option>
              ))}
            </select>
            {errors.item_id ? <p className="field-error">{errors.item_id}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Quantity</label>
            <input
              className={`input ${errors.quantity ? "input-error" : ""}`}
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, quantity: event.target.value }));
                setErrors((prev) => ({ ...prev, quantity: undefined }));
              }}
            />
            {errors.quantity ? <p className="field-error">{errors.quantity}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="input min-h-28"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>

          <button type="submit" className="btn-primary">
            Record Issue
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Prototype Notes</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Stock is reduced automatically after a successful issue.</li>
          <li>A stock transaction is created with type <strong>STOCK_ISSUE</strong>.</li>
          <li>Server-side validation prevents zero quantity and negative stock.</li>
        </ul>
      </div>
    </div>
  );
}
