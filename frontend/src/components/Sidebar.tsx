import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useAuth } from "../../contexts/AuthContext";
import * as LucideIcons from "lucide-react";

type LucideIconName = keyof typeof LucideIcons;

interface IconComponentProps {
  iconName: LucideIconName;
  size?: number;
}

interface RouteItem {
  path: string;
  label: string;
  icon: LucideIconName;
}

const IconComponent: React.FC<IconComponentProps> = ({ iconName, size = 20 }) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideIcons.LucideProps>| undefined;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const {
    getCurrentUserRoutes,
    getCurrentRoleName,
    switchRole,
    availableRoles,
    currentRole,
  } = useRole();

  const { user, logout } = useAuth();
  const location = useLocation();

  const routes: RouteItem[] = getCurrentUserRoutes() as RouteItem[];
 
  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg"
      >
        <IconComponent iconName="Menu" size={20} />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${isCollapsed ? "w-16" : "w-64"}
          bg-gray-900 text-white flex flex-col shadow-xl
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-blue-400">BrightBuy</h1>
              <p className="text-sm text-gray-400">{getCurrentRoleName()}</p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1 hover:bg-gray-800 rounded"
          >
            <IconComponent
              iconName={isCollapsed ? "ChevronRight" : "ChevronLeft"}
              size={16}
            />
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-gray-700">
            <div className="text-sm text-gray-300">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              <p className="text-xs text-blue-400 mt-1">{getCurrentRoleName()}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {routes.map((route) => {
            const isActive = location.pathname === route.path;
            return (
              <Link
                key={route.path}
                to={route.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center p-3 rounded-lg transition-colors duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center" : "space-x-3"}
                `}
              >
                <IconComponent iconName={route.icon} size={20} />
                {!isCollapsed && (
                  <span className="font-medium">{route.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <IconComponent iconName="User" size={16} />
              </div>
              {!isCollapsed && user && (
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                title="Logout"
              >
                <IconComponent iconName="LogOut" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <IconComponent iconName="LogOut" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Logout</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
