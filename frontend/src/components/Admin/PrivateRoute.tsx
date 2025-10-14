import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useRole } from "../../../contexts/RoleContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, authReady } = useAuth();
  const { currentRole } = useRole();
  const location = useLocation();

  // While auth hydrating, don't redirect yet
  if (!authReady) {
    return <div className="w-full flex items-center justify-center py-10 text-gray-500 text-sm">Authorizing...</div>;
  }

  // Not logged in → go to login (after hydration only)
  if (!isAuthenticated()) {
    // store last attempted path for post-login redirect
    try { sessionStorage.setItem('brightbuy_last_path', location.pathname + location.search); } catch {}
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch → redirect to correct dashboard for current role
  if (roles && user && !roles.includes(user.role)) {
    switch (currentRole) {
      case "SuperAdmin":
        return <Navigate to="/superadmin" replace />;
      case "Admin":
        return <Navigate to="/admin" replace />;
      case "WarehouseStaff":
        return <Navigate to="/admin/inventory" replace />;
      case "DeliveryStaff":
        return <Navigate to="/admin/deliveries" replace />;
      default:
        return <Navigate to="/shop" replace />; // normal user
    }
  }

  // User has access
  return <>{children}</>;
};

export default PrivateRoute;
