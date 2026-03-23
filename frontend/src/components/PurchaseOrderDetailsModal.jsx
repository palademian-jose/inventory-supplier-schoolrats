import Modal from "./Modal";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";

export default function PurchaseOrderDetailsModal({ order, isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      title={order ? `Purchase Order ${order.order_number}` : "Purchase Order"}
      onClose={onClose}
      eyebrow="Order Details"
      maxWidth="max-w-5xl"
    >
      {order ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Supplier</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{order.supplier_name}</p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
              <div className="mt-2">
                <StatusBadge value={order.status} />
              </div>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total Amount</p>
              <p className="mt-2 text-sm font-medium text-slate-800">${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Created By</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{order.created_by_name || "-"}</p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Approved By</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{order.approved_by_name || "-"}</p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Expected Delivery</p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "-"}
              </p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Approved At</p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {order.approved_at ? new Date(order.approved_at).toLocaleString() : "-"}
              </p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Received At</p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                {order.received_at ? new Date(order.received_at).toLocaleString() : "-"}
              </p>
            </div>
            <div className="card-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notes</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{order.notes || "-"}</p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "item_name", label: "Item" },
              { key: "item_category", label: "Category" },
              { key: "unit_symbol", label: "Unit", render: (row) => row.unit_symbol || "-" },
              { key: "quantity", label: "Ordered" },
              { key: "received_quantity", label: "Received" },
              { key: "unit_price", label: "Unit Price", render: (row) => `$${Number(row.unit_price).toFixed(2)}` },
              { key: "line_total", label: "Line Total", render: (row) => `$${Number(row.line_total).toFixed(2)}` },
              { key: "remarks", label: "Remarks", render: (row) => row.remarks || "-" }
            ]}
            rows={order.details || []}
            emptyState={{
              title: "No line items",
              description: "This purchase order has no saved line items."
            }}
          />
        </div>
      ) : null}
    </Modal>
  );
}
