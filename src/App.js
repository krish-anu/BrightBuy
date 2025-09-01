import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import AssignedDeliveries from './pages/admin/AssignedDeliveries';
import DeliveryStatus from './pages/admin/DeliveryStatus';

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Login route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Redirect root to admin dashboard */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              
              {/* Protected Admin routes */}
              <Route path="/admin" element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="orders" element={<Orders />} />
                <Route path="reports" element={<Reports />} />
                <Route path="deliveries" element={<AssignedDeliveries />} />
                <Route path="delivery-status" element={<DeliveryStatus />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </Router>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
