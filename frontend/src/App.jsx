import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { useAuth } from "./context/AuthContext";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import IssueItemsPage from "./pages/IssueItemsPage";
import ItemsPage from "./pages/ItemsPage";
import LoginPage from "./pages/LoginPage";
import RecipientsPage from "./pages/MembersPage";
import PaymentsPage from "./pages/PaymentsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SupplierCatalogPage from "./pages/SupplierItemsPage";
import SuppliersPage from "./pages/SuppliersPage";
import TransactionsPage from "./pages/TransactionsPage";
import UnitsPage from "./pages/UnitsPage";

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
          <Route path="/recipients" element={<RecipientsPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/supplier-catalog" element={<SupplierCatalogPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/stock-issues" element={<IssueItemsPage />} />
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
