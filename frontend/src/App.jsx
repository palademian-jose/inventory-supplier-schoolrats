import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import IssueItemsPage from "./pages/IssueItemsPage";
import ItemsPage from "./pages/ItemsPage";
import LoginPage from "./pages/LoginPage";
import MembersPage from "./pages/MembersPage";
import PaymentsPage from "./pages/PaymentsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SupplierItemsPage from "./pages/SupplierItemsPage";
import SuppliersPage from "./pages/SuppliersPage";
import TransactionsPage from "./pages/TransactionsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/supplier-items" element={<SupplierItemsPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/issue-items" element={<IssueItemsPage />} />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
