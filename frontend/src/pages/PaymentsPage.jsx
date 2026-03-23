import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createResource, fetchResource } from "../api/resources";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    purchase_order_id: "",
    amount: "",
    payment_method: "Cash",
    notes: ""
  });

  const loadData = async () => {
    try {
      const [paymentRows, orderRows] = await Promise.all([
        fetchResource("/payments"),
        fetchResource("/purchase-orders")
      ]);
      setPayments(paymentRows);
      setOrders(orderRows);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load payments");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.purchase_order_id) nextErrors.purchase_order_id = "Purchase order is required";
    if (form.amount === "" || Number(form.amount) <= 0) nextErrors.amount = "Amount must be greater than zero";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the payment form");
      return;
    }
    try {
      await createResource("/payments", {
        ...form,
        purchase_order_id: Number(form.purchase_order_id),
        amount: Number(form.amount)
      });
      toast.success("Payment recorded");
      setIsOpen(false);
      setErrors({});
      setForm({ purchase_order_id: "", amount: "", payment_method: "Cash", notes: "" });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to record payment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Finance Tracking
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Payments
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track payments made against purchase orders.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
            Record Payment
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "order_number", label: "Order Number" },
          { key: "amount", label: "Amount", render: (row) => (row.amount ? `$${Number(row.amount).toFixed(2)}` : "-") },
          { key: "payment_method", label: "Method" },
          { key: "payment_status", label: "Status", type: "status" },
          {
            key: "payment_date",
            label: "Payment Date",
            render: (row) => (row.payment_date ? new Date(row.payment_date).toLocaleDateString() : "-")
          }
        ]}
        rows={payments}
        emptyState={{
          title: "No payments recorded",
          description: "Record a payment against a purchase order to show pending, partial, or paid status.",
          action: (
            <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
              Record Payment
            </button>
          )
        }}
      />

      <Modal isOpen={isOpen} title="Record Payment" onClose={() => setIsOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Purchase Order</label>
            <select
              className={`select ${errors.purchase_order_id ? "input-error" : ""}`}
              value={form.purchase_order_id}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, purchase_order_id: event.target.value }));
                setErrors((prev) => ({ ...prev, purchase_order_id: undefined }));
              }}
            >
              <option value="">Select purchase order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number} - {order.supplier_name}
                </option>
              ))}
            </select>
            {errors.purchase_order_id ? <p className="field-error">{errors.purchase_order_id}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
            <input
              className={`input ${errors.amount ? "input-error" : ""}`}
              type="number"
              min="0.01"
              value={form.amount}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, amount: event.target.value }));
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            {errors.amount ? <p className="field-error">{errors.amount}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Method</label>
            <select
              className="select"
              value={form.payment_method}
              onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}
            >
              {["Cash", "Bank Transfer", "Card"].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="input min-h-24"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
