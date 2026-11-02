import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { TransactionDetail } from './pages/TransactionDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Alerts } from './pages/Alerts';
import { AlertDetail } from './pages/AlertDetail';
import { Reports } from './pages/Reports';
import { ModelPerformance } from './pages/ModelPerformance';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <LoadingSpinner label="Validating security credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:id" element={<TransactionDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="alerts/:id" element={<AlertDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="model-performance" element={<ModelPerformance />} />
            <Route
              path="users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
