import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import { RoleProvider } from "../../contexts/RoleContext";

// Admin Components
import PrivateRoute from "../components/PrivateRoute";
import AdminLayout from "../components/AdminLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Inventory from "../pages/Admin/Inventory";
import Orders from "../pages/Admin/Orders";
import UserManagement from "../pages/Admin/UserManagement";
import Reports from "../pages/Admin/Reports";
import AssignedDeliveries from "../pages/Admin/AssignedDeliveries";
import DeliveryStatus from "../pages/Admin/DeliveryStatus";

// User Components
import Layout from "@/components/Layout/Layout";
import HomePage from "@/pages/User/HomePage";
import ProductsPage from "@/pages/User/ProductsPage";
import CartPage from "@/pages/User/CartPage";
import Login from "@/components/LoginPage";
import UserSignup from "@/pages/Authpage/UserSignup";

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <div className="App">
          <Routes>
            {/* ========== User Routes ========== */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<UserSignup />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="cart" element={<CartPage />} />
            </Route>

            {/* ========== Admin Routes (Protected) ========== */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="reports" element={<Reports />} />
              <Route path="deliveries" element={<AssignedDeliveries />} />
              <Route path="delivery-status" element={<DeliveryStatus />} />
            </Route>
          </Routes>
        </div>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
