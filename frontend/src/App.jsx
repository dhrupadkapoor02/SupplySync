import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import ProtectedRoute from './features/auth/ProtectedRoute.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Lazy-loaded admin pages (we will create these next)
import AdminDashboard from './features/admin/AdminDashboard.jsx';

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
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user?.role === 'ADMIN'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}