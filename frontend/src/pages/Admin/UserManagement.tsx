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
  switch (role) {
    case "admin": return "admin";
    case "warehouseStaff": return "warehouse";
    case "deliveryStaff": return "delivery";
    case "customer": return "customer";
    default: return role;
  }
};

// Display friendly role names
const displayRole = (role: string) => {
  switch (role) {
    case "admin": return "Admin";
    case "warehouseStaff": return "Warehouse Staff";
    case "deliveryStaff": return "Delivery Staff";
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
      if (res?.data) setUsers(res.data);
      console.log("Fetched users:", res?.data);
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
    switch (normalizeRole(role)) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "warehouse": return "bg-blue-100 text-blue-800";
      case "delivery": return "bg-green-100 text-green-800";
      case "customer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="admin">Admin</option>
            <option value="warehouse">Warehouse Staff</option>
            <option value="delivery">Delivery Staff</option>
            <option value="customer">Customer</option>
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <IconComponent iconName="UserPlus" size={16} />
            <span className="ml-2">Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="Edit User">
                        <IconComponent iconName="Edit" size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="Reset Password">
                        <IconComponent iconName="Key" size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Deactivate">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {["admin", "warehouse", "delivery", "customer"].map((role) => (
          <div key={role} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-md">
                <IconComponent
                  iconName={
                    role === "admin"
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
                  {users.filter((u) => normalizeRole(u.role) === role).length}
                </div>
                <div className="text-sm text-gray-500">{displayRole(role)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
