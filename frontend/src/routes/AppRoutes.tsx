import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import { RoleProvider } from "../../contexts/RoleContext";
// import UserPrivateRoute from "./UserPrivateRoute";


// Route Protection
import UserPrivateRoute from "./UserPrivateRoute";
import PrivateRoute from "../components/Admin/PrivateRoute";
import AdminLayout from "../components/Admin/AdminLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Inventory from "../pages/Admin/Inventory";
import Orders from "../pages/Admin/Orders";
import UserManagement from "../pages/Admin/UserManagement";
import Reports from "../pages/Admin/Reports";
import AssignedDeliveries from "../pages/Admin/AssignedDeliveries";
import DeliveryStatus from "../pages/Admin/DeliveryStatus";
import AdminProfile from "../pages/Admin/Profile";

// User Components
import Layout from "@/components/Layout/Layout";
import HomePage from "@/pages/User/HomePage";
import ProductsPage from "@/pages/User/ProductsPage";
import CartPage from "@/pages/User/CartPage";
import UserSignup from "@/pages/Authpage/UserSignup";
import ProductDetailPage from "@/pages/User/ProductDetailsPage";
import UserLogin from "@/pages/Authpage/UserLogin";
import UserProfile from "../pages/Profile/UserProfile";
import OrderPayment from "@/pages/User/Order/OrderPayment";
import OrderSummary from "@/pages/User/Order/OrderSummary";
import OrderConfirm from "@/pages/User/Order/OrderConfirm";
import OrderSuccess from "@/pages/User/Order/OrderSuccess";

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Routes>
          {/* ========== User Routes ========== */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<UserLogin />} />
            <Route path="signup" element={<UserSignup />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="products/:productID" element={<ProductDetailPage />} />
            <Route path="products/:productID" element={<ProductDetailPage />} />
            <Route path="order">
              <Route path="confirm" element={<OrderConfirm />} />
              <Route path="summary" element={<OrderSummary />} />
              <Route path="payment" element={<OrderPayment />} />
              <Route path="success" element={<OrderSuccess />} />
            </Route>
            {/* Protected user routes */}
            <Route element={<UserPrivateRoute />}>
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* ========== Admin Routes ========== */}
          {/* All admin roles use same PrivateRoute and AdminLayout */}
          <Route
            path="admin/*"
            element={
              <PrivateRoute
                roles={[
                  "Admin",
                  "SuperAdmin",
                  "WarehouseStaff",
                  "DeliveryStaff",
                ]}
              >
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reports" element={<Reports />} />
            <Route path="deliveries" element={<AssignedDeliveries />} />
            <Route path="delivery-status" element={<DeliveryStatus />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Routes>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
