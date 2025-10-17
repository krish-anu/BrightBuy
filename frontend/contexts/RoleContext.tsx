import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import * as LucideIcons from "lucide-react";

// Type for each route item in sidebar
export interface RouteItem {
  path: string;
  label: string;
  icon: keyof typeof LucideIcons; // Any valid Lucide icon
}

// Type for RoleContext
export interface RoleContextType {
  currentRole: string;
  getCurrentUserRoutes: () => RouteItem[];
  getCurrentRoleName: () => string;
  hasAccess: (routePath: string) => boolean;
  switchRole: (newRole: string) => void;
  availableRoles: string[];
}

// Create the context
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Hook to use RoleContext
export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

// Props for RoleProvider
interface RoleProviderProps {
  children: ReactNode;
}

// RoleProvider component
export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<string>("User"); // Default role

  // Update role when user changes
  useEffect(() => {
    if (user && user.role) {
      // console.log("RoleProvider setting currentRole to:", user.role);
      setCurrentRole(user.role);
    }
  }, [user]);

  // Define role configurations and sidebar routes
  const roleConfig: Record<string, { name: string; routes: RouteItem[] }> = {
    SuperAdmin: {
      name: "Super Admin",
      routes: [
        // Provide access to all admin-related routes using unified /admin paths
        { path: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
        { path: "/admin/users", label: "User Management", icon: "Users" },
        { path: "/admin/inventory", label: "Inventory", icon: "Package" },
        { path: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
        { path: "/admin/reports", label: "Reports", icon: "BarChart3" },
        { path: "/admin/profile", label: "Profile", icon: "User" },
        // Removed Assigned Deliveries and Update Status from SuperAdmin sidebar
      ],
    },
    Admin: {
      name: "Main Admin",
      routes: [
        { path: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
        { path: "/admin/users", label: "User Management", icon: "Users" },
        { path: "/admin/inventory", label: "Inventory", icon: "Package" },
        { path: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
        { path: "/admin/reports", label: "Reports", icon: "BarChart3" },
        { path: "/admin/profile", label: "Profile", icon: "User" },
      ],
    },
    WarehouseStaff: {
      name: "Warehouse Staff",
      routes: [
        { path: "/admin/inventory", label: "Inventory", icon: "Package" },
        { path: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
      ],
    },
    DeliveryStaff: {
      name: "Delivery Staff",
      routes: [
        {
          path: "/admin/deliveries",
          label: "Assigned Deliveries",
          icon: "Truck",
        },
        {
          path: "/admin/delivery-status",
          label: "Update Status",
          icon: "RefreshCw",
        },
      ],
    },
    User: {
      name: "Customer",
      routes: [
        { path: "/shop", label: "Shop", icon: "ShoppingBag" },
        { path: "/orders", label: "My Orders", icon: "Package" },
        { path: "/profile", label: "Profile", icon: "User" },
      ],
    },
  };

  // Get current user's navigation routes
  const getCurrentUserRoutes = (): RouteItem[] => {
    return roleConfig[currentRole]?.routes || [];
  };

  // Get current role display name
  const getCurrentRoleName = (): string => {
    return roleConfig[currentRole]?.name || "Unknown Role";
  };

  // Check if user has access to a route
  const hasAccess = (routePath: string): boolean => {
    return getCurrentUserRoutes().some((route) => route.path === routePath);
  };

  // Switch role (manual role switching, e.g. for testing)
  const switchRole = (newRole: string) => {
    if (roleConfig[newRole]) {
      setCurrentRole(newRole);
    }
  };

  // Context value
  const value: RoleContextType = {
    currentRole,
    getCurrentUserRoutes,
    getCurrentRoleName,
    hasAccess,
    switchRole,
    availableRoles: Object.keys(roleConfig),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
