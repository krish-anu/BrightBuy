import React, { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getAllUsers } from "../../services/user.services";

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

const IconComponent: React.FC<IconComponentProps> = ({
  iconName,
  size = 20,
}) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

// Normalize roles for filtering and display
const normalizeRole = (role: string) => {
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case "admin": return "admin";
    case "superadmin": return "superadmin";
    case "warehousestaff": return "warehouse";
    case "deliverystaff": return "delivery";
    case "customer": return "customer";
    default: return lowerRole;
  }
};

// Display friendly role names
const displayRole = (role: string) => {
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case "admin": return "Admin";
    case "superadmin": return "Super Admin";
    case "warehousestaff": return "Warehouse Staff";
    case "deliverystaff": return "Delivery Staff";
    case "customer": return "Customer";
    default: return role;
  }
};

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res?.data) {
        setUsers(res.data);
        console.log("Fetched users:", res?.data);
        console.log("User roles:", res?.data.map((u: any) => ({ id: u.id, role: u.role, normalized: normalizeRole(u.role) })));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "" || normalizeRole(user.role) === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const normalizedRole = normalizeRole(role);
    switch (normalizedRole) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "superadmin": return "bg-red-100 text-red-800";
      case "warehouse": return "bg-blue-100 text-blue-800";
      case "delivery": return "bg-green-100 text-green-800";
      case "customer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // const getStatusColor = (status: string) =>
  //   status === "active"
  //     ? "bg-green-100 text-green-800"
  //     : "bg-red-100 text-red-800";

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage system users and their roles</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconComponent iconName="Search" size={16} />
            </div>
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="warehouse">Warehouse Staff</option>
            <option value="delivery">Delivery Staff</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <IconComponent iconName="User" size={20} />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {displayRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-3">
                      <button 
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors duration-200" 
                        title="Edit User"
                      >
                        <IconComponent iconName="Edit" size={16} />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors duration-200" 
                        title="Reset Password"
                      >
                        <IconComponent iconName="Key" size={16} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors duration-200" 
                        title="Deactivate"
                      >
                        <IconComponent iconName="UserX" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
        {["superadmin", "admin", "warehouse", "delivery", "customer"].map((role) => {
          const count = users.filter((u) => normalizeRole(u.role) === role).length;
          console.log(`Role ${role} count:`, count, users.filter((u) => normalizeRole(u.role) === role));
          
          return (
            <div key={role} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-md">
                  <IconComponent
                    iconName={
                      role === "superadmin"
                        ? "Crown"
                        : role === "admin"
                        ? "Shield"
                        : role === "warehouse"
                        ? "Package"
                        : role === "delivery"
                        ? "Truck"
                        : "Users"
                    }
                    size={24}
                  />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {count}
                  </div>
                  <div className="text-sm text-gray-500">{displayRole(role)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserManagement;
