import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import ProtectedRoute from "./features/auth/ProtectedRoute.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import AdminDashboard from "./features/admin/AdminDashboard.jsx";
import InvoicesPage from "./features/invoices/InvoicesPage.jsx";
import ProductsPage from "./features/products/ProductsPage.jsx";
import OrdersPage from "./features/orders/OrdersPage.jsx";
import RetailersPage from "./features/retailers/RetailersPage.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/retailers" element={<RetailersPage />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user?.role === "ADMIN" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
