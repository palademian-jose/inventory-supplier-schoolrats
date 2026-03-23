import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchResource } from "../api/resources";
import DataTable from "../components/DataTable";
import TransactionDetailsModal from "../components/TransactionDetailsModal";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filters, setFilters] = useState({
    item_id: "",
    type: "",
    start_date: "",
    end_date: ""
  });

  const loadData = async (params = filters) => {
    try {
      const [transactionRows, itemRows] = await Promise.all([
        fetchResource("/stock-transactions", params),
        fetchResource("/items", { page: 1, limit: 100 })
      ]);
      setTransactions(transactionRows);
      setItems(itemRows.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load transactions");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Audit Trail
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Stock Transactions
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Filter stock movement by item, date, and transaction type.
        </p>
      </div>

      <div className="card p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <select
            className="select"
            value={filters.item_id}
            onChange={(event) => setFilters((prev) => ({ ...prev, item_id: event.target.value }))}
          >
            <option value="">All items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="">All types</option>
            {["STOCK_RECEIPT", "STOCK_ISSUE", "ADJUSTMENT"].map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            value={filters.start_date}
            onChange={(event) => setFilters((prev) => ({ ...prev, start_date: event.target.value }))}
          />
          <input
            className="input"
            type="date"
            value={filters.end_date}
            onChange={(event) => setFilters((prev) => ({ ...prev, end_date: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => loadData(filters)}>
            Apply Filters
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const next = { item_id: "", type: "", start_date: "", end_date: "" };
              setFilters(next);
              loadData(next);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "item_name", label: "Item" },
          { key: "transaction_type", label: "Type", type: "status" },
          { key: "quantity", label: "Quantity" },
          { key: "reference_type", label: "Reference" },
          { key: "notes", label: "Notes" },
          {
            key: "transaction_date",
            label: "Date",
            render: (row) => new Date(row.transaction_date).toLocaleString()
          }
        ]}
        rows={transactions}
        actions={(row) => (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSelectedTransaction(row)}
          >
            View
          </button>
        )}
        emptyState={{
          title: "No matching transactions",
          description:
            "Try broadening the date range or clearing the filters to view available stock movement history."
        }}
      />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
