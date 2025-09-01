import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState('admin'); // Default to 'admin'

  // Update role when user changes
  useEffect(() => {
    if (user && user.role) {
      setCurrentRole(user.role);
    }
  }, [user]);
  
  // Role configurations for sidebar navigation
  const roleConfig = {
    admin: {
      name: 'Main Admin',
      routes: [
        { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/admin/users', label: 'User Management', icon: 'Users' },
        { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
        { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
        { path: '/admin/reports', label: 'Reports', icon: 'BarChart3' }
      ]
    },
    warehouse: {
      name: 'Warehouse Staff',
      routes: [
        { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
        { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' }
      ]
    },
    delivery: {
      name: 'Delivery Staff',
      routes: [
        { path: '/admin/deliveries', label: 'Assigned Deliveries', icon: 'Truck' },
        { path: '/admin/delivery-status', label: 'Update Status', icon: 'RefreshCw' }
      ]
    }
  };

  // Get current user's navigation routes
  const getCurrentUserRoutes = () => {
    return roleConfig[currentRole]?.routes || [];
  };

  // Get current user's role display name
  const getCurrentRoleName = () => {
    return roleConfig[currentRole]?.name || 'Unknown Role';
  };

  // Check if user has access to a specific route
  const hasAccess = (routePath) => {
    const userRoutes = getCurrentUserRoutes();
    return userRoutes.some(route => route.path === routePath);
  };

  // Switch role (for demo purposes)
  const switchRole = (newRole) => {
    if (roleConfig[newRole]) {
      setCurrentRole(newRole);
    }
  };

  const value = {
    currentRole,
    getCurrentUserRoutes,
    getCurrentRoleName,
    hasAccess,
    switchRole,
    availableRoles: Object.keys(roleConfig)
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
