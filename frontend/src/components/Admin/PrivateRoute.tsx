import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, authReady } = useAuth();
  const location = useLocation();

  // While auth hydrating, don't redirect yet
  if (!authReady) {
    return <div className="w-full flex items-center justify-center py-10 text-gray-500 text-sm">Authorizing...</div>;
  }

  // Not logged in → go to login (after hydration only)
  if (!isAuthenticated()) {
    // store last attempted path for post-login redirect
    try { sessionStorage.setItem('brightbuy_last_path', location.pathname + location.search); } catch {}
    // If this route is under /admin, send the user to the admin login page
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch → if we have a user object (authenticated), redirect based on role
  // If user is missing for some reason, send to login (safety)
  if (roles && user && !roles.includes(user.role)) {
    // Authenticated but not allowed for these admin roles → send to shop
    return <Navigate to="/shop" replace />;
  }

  if (roles && !user) {
    // Edge case: roles requested but user is missing. Treat as unauthenticated.
    try { sessionStorage.setItem('brightbuy_last_path', location.pathname + location.search); } catch {}
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User has access
  return <>{children}</>;
};

export default PrivateRoute;
