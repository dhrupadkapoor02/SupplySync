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
import ShopPage from "./features/retailers/ShopPage.jsx";
import BrandCatalogPage from "./features/retailers/BrandCatalogPage.jsx";
import CartPage from "./features/retailers/CartPage.jsx";
import RetailerOrdersPage from "./features/retailers/RetailerOrdersPage.jsx";

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
        path="/shop"
        element={
          <ProtectedRoute>
            <ShopPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/brand/:brandId"
        element={
          <ProtectedRoute>
            <BrandCatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/orders"
        element={
          <ProtectedRoute>
            <RetailerOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user?.role === "ADMIN" ? (
            <Navigate to="/admin" replace />
          ) : user?.status === "APPROVED" ? (
            <Navigate to="/shop" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
