import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createResource, fetchResource } from "../api/resources";

export default function IssueItemsPage() {
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    member_id: "",
    item_id: "",
    quantity: 1,
    notes: ""
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [memberRows, itemRows] = await Promise.all([
          fetchResource("/members", { page: 1, limit: 100 }),
          fetchResource("/items", { page: 1, limit: 100 })
        ]);
        setMembers(memberRows.data);
        setItems(itemRows.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load issue item form");
      }
    };

    loadOptions();
  }, []);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.member_id) nextErrors.member_id = "Member is required";
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
      await createResource("/issues", {
        member_id: Number(form.member_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        notes: form.notes
      });
      toast.success("Item issued successfully");
      setErrors({});
      setForm({ member_id: "", item_id: "", quantity: 1, notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to issue item");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Member Fulfillment
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Issue Items to Members
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select a member, choose an item, and record the quantity.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Member</label>
            <select
              className={`select ${errors.member_id ? "input-error" : ""}`}
              value={form.member_id}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, member_id: event.target.value }));
                setErrors((prev) => ({ ...prev, member_id: undefined }));
              }}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.member_id ? <p className="field-error">{errors.member_id}</p> : null}
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
            Issue Item
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Prototype Notes</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Stock is reduced automatically after a successful issue.</li>
          <li>A stock transaction is created with type <strong>ISSUE_TO_MEMBER</strong>.</li>
          <li>Server-side validation prevents zero quantity and negative stock.</li>
        </ul>
      </div>
    </div>
  );
}
