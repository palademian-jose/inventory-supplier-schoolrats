import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchSummary } from "../api/resources";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import StatCard from "../components/StatCard";
import TransactionDetailsModal from "../components/TransactionDetailsModal";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetchSummary();
        setData(response);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (!data?.cards) {
    return (
      <div className="card p-6 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
          Dashboard unavailable
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Summary data could not be loaded.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          The page stays available now even if the API request fails. Check that the backend is
          running and that `VITE_API_URL` points to the correct server.
        </p>
      </div>
    );
  }

  const operationalStatus =
    data.cards.lowStockItems > 0
      ? "Immediate attention recommended for low stock coverage."
      : "Stock levels are currently within safe reorder thresholds.";

  const quickActions = [
    { label: "Add Item", to: "/items" },
    { label: "Add Supplier", to: "/suppliers" },
    { label: "Create Purchase Order", to: "/purchase-orders" },
    { label: "Record Stock Issue", to: "/stock-issues" }
  ];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden p-6 md:p-7">
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <h3 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900">
              Keep the full inventory story visible from stock health to supplier readiness.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              This dashboard is designed to present the system clearly: current item counts,
              low-stock exposure, supplier coverage, and pending procurement work.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="card-muted rounded-2xl px-4 py-4 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick Action
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{action.label}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="card-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Operational Status
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {data.cards.lowStockItems} item{data.cards.lowStockItems === 1 ? "" : "s"} below
                reorder threshold
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{operationalStatus}</p>
            </div>

            <div className="card-muted grid gap-3 p-5">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-500">Suppliers tracked</span>
                <span className="text-lg font-semibold text-slate-900">
                  {data.cards.totalSuppliers}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-500">Pending purchase orders</span>
                <span className="text-lg font-semibold text-slate-900">
                  {data.cards.pendingPurchaseOrders}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Items" value={data.cards.totalItems} />
        <StatCard title="Low Stock Items" value={data.cards.lowStockItems} accent="alert" />
        <StatCard title="Total Suppliers" value={data.cards.totalSuppliers} accent="neutral" />
        <StatCard
          title="Pending Purchase Orders"
          value={data.cards.pendingPurchaseOrders}
          accent="brand"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <h3 className="section-title">Recent Stock Transactions</h3>
            <p className="section-subtitle">Latest purchase and issue activity.</p>
          </div>
          <DataTable
            columns={[
              { key: "item_name", label: "Item" },
              { key: "transaction_type", label: "Type", type: "status" },
              { key: "quantity", label: "Quantity" },
              {
                key: "transaction_date",
                label: "Date",
                render: (row) => new Date(row.transaction_date).toLocaleString()
              }
            ]}
            rows={data.recentTransactions}
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
              title: "No transactions yet",
              description:
                "Create a purchase order or record a stock issue and the activity will appear here."
            }}
          />
        </div>
      </section>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
