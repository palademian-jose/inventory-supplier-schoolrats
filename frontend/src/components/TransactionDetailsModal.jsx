import Modal from "./Modal";
import StatusBadge from "./StatusBadge";

const detailRows = (transaction) => [
  { label: "Transaction ID", value: transaction?.id },
  { label: "Item", value: transaction?.item_name },
  { label: "Category", value: transaction?.item_category || "Not specified" },
  { label: "Member", value: transaction?.member_name || "Not linked" },
  { label: "Quantity", value: transaction?.quantity },
  { label: "Reference Type", value: transaction?.reference_type || "Not specified" },
  { label: "Reference ID", value: transaction?.reference_id || "Not specified" },
  {
    label: "Date",
    value: transaction?.transaction_date
      ? new Date(transaction.transaction_date).toLocaleString()
      : "Not specified"
  }
];

export default function TransactionDetailsModal({ transaction, isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      title="Transaction Details"
      onClose={onClose}
      eyebrow="Transaction"
      maxWidth="max-w-3xl"
    >
      {transaction ? (
        <div className="space-y-5">
          <div className="card-muted flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Transaction Type
              </p>
              <div className="mt-2">
                <StatusBadge value={transaction.transaction_type} />
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Notes
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                {transaction.notes || "No notes were recorded for this transaction."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {detailRows(transaction).map((row) => (
              <div key={row.label} className="card-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {row.label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
