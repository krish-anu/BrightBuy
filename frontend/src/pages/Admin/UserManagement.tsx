import React, { useEffect, useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getAllUsers, updateUser, deleteUser, approveUser } from "../../services/user.services";
import { useAuth } from "../../../contexts/AuthContext";

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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_accepted?: number | boolean;
  phone?: string;
  address?: any;
  cityId?: number;
  createdAt: string;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'SuperAdmin';
  // Compute the earliest-created SuperAdmin (the "first" one) so we can show N/A for it
  const firstSuperAdminId = useMemo(() => {
    const superAdmins = users.filter(u => u.role === 'SuperAdmin');
    if (superAdmins.length === 0) return null;
    superAdmins.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return superAdmins[0].id;
  }, [users]);

  // Pending requests: any user whose role_accepted == 0 (including SuperAdmin entries)
  const pendingRequests = isSuperAdmin ? users.filter(u => !u.role_accepted) : [];
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Editing state
  const [, setIsUpdating] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
  city: "",
    postalCode: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res?.data) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Modal handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    
    // Parse address JSON into separate fields
  let addressLine1 = "", addressLine2 = "", city = "", postalCode = "";
    
    if (user.address) {
      try {
        const addressObj = typeof user.address === 'string' ? JSON.parse(user.address) : user.address;
        addressLine1 = addressObj.line1 || addressObj.street || "";
        addressLine2 = addressObj.line2 || "";
  // cityId is used in backend; keep city string empty here unless you join by cities
  // city = addressObj.city || "";
        postalCode = addressObj.postalCode || addressObj.postal_code || "";
      } catch {
        // If address is not valid JSON, treat as line1
        addressLine1 = typeof user.address === 'string' ? user.address : "";
      }
    }
    
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      addressLine1,
      addressLine2,
  city,
      postalCode,
    });
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    // Basic validation
    if (!editForm.name.trim() || !editForm.email.trim()) {
      alert("Name and email are required!");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Combine address fields into JSON object
      let addressData = null;
  if (editForm.addressLine1.trim() || editForm.city.trim()) {
        addressData = {
          line1: editForm.addressLine1.trim() || null,
          line2: editForm.addressLine2.trim() || null,
          // cityId is the new source of truth; when string city UI is replaced, send cityId as well
          city: editForm.city.trim() || null,
          postalCode: editForm.postalCode.trim() || null
        };
        
        // Remove null values to keep JSON clean
        addressData = Object.fromEntries(
          Object.entries(addressData).filter(([_, value]) => value !== null)
        );
        
        // If no valid address data, set to null
        if (Object.keys(addressData).length === 0) {
          addressData = null;
        }
      }
      
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone || undefined,
        address: addressData
      };
      
      console.log("Updating user:", selectedUser.id, updateData);
      const response = await updateUser(selectedUser.id, updateData);
      console.log("Update response:", response);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...updateData }
          : user
      ));
      
      setEditModalOpen(false);
      setSelectedUser(null);
      
      // Refresh users to get latest data
      fetchUsers();
      
      alert("User updated successfully!");
    } catch (error: any) {
      console.error("Error updating user:", error);
      alert("Failed to update user: " + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      
      // Update local state
      setUsers(users.filter(user => user.id !== selectedUser.id));
      
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
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
    // Non-superadmin: ensure only approved users (should already be filtered server-side, but double-guard)
    const approvedCheck = isSuperAdmin || user.role_accepted || user.role === 'Customer' || user.role === 'SuperAdmin';
    return matchesSearch && matchesRole && approvedCheck;
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            User Management
            {isSuperAdmin && pendingRequests.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                {pendingRequests.length} Pending Approval
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">Manage system users and their roles</p>
        </div>
        {isSuperAdmin && pendingRequests.length > 0 && (
          <div className="bg-white border border-yellow-200 rounded-md px-4 py-3 flex items-center text-sm text-yellow-800 shadow-sm">
            <IconComponent iconName="Info" size={16} />
            <span className="ml-2">There {pendingRequests.length === 1 ? 'is' : 'are'} {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'} awaiting approval.</span>
          </div>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                )}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {displayRole(user.role)}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'SuperAdmin' ? (
                        user.id === firstSuperAdminId ? (
                          <span className="text-xs text-gray-400">N/A</span>
                        ) : user.role_accepted ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <IconComponent iconName="CheckCircle2" size={14} />
                            <span className="ml-1">Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                            <IconComponent iconName="Clock" size={14} />
                            <span className="ml-1">Pending</span>
                          </span>
                        )
                      ) : (
                        user.role_accepted ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <IconComponent iconName="CheckCircle2" size={14} />
                            <span className="ml-1">Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                            <IconComponent iconName="Clock" size={14} />
                            <span className="ml-1">Pending</span>
                          </span>
                        )
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-3">
                      {isSuperAdmin && !user.role_accepted && (
                        <button
                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1 rounded transition-colors duration-200"
                          title="Approve User"
                          onClick={async () => {
                            try {
                              const res = await approveUser(user.id);
                              // API returns updated user in res.data; fall back to assuming role_accepted becomes true
                              const updatedUser = res?.data || res;
                              setUsers(prev => prev.map(u => u.id === user.id ? ({ ...u, ...(updatedUser?.id ? updatedUser : { role_accepted: 1 }) }) : u));
                            } catch (e) {
                              alert('Failed to approve user');
                            }
                          }}
                        >
                          <IconComponent iconName="BadgeCheck" size={16} />
                        </button>
                      )}
                      <button 
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors duration-200" 
                        title="View User Details"
                        onClick={() => handleViewUser(user)}
                      >
                        <IconComponent iconName="Eye" size={16} />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors duration-200" 
                        title="Edit User"
                        onClick={() => handleEditUser(user)}
                      >
                        <IconComponent iconName="Edit" size={16} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors duration-200" 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user)}
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

      {isSuperAdmin && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IconComponent iconName="Clock" size={22} /> Pending Approval Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending approval requests.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingRequests.map(pr => (
                  <li key={pr.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <IconComponent iconName="User" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pr.name} <span className="text-gray-400">• {displayRole(pr.role)}</span></p>
                        <p className="text-xs text-gray-500">{pr.email}</p>
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={async () => {
                        try {
                          const res = await approveUser(pr.id);
                          const updatedUser = res?.data || res;
                          setUsers(prev => prev.map(u => u.id === pr.id ? ({ ...u, ...(updatedUser?.id ? updatedUser : { role_accepted: 1 }) }) : u));
                        } catch (e) {
                          alert('Failed to approve user');
                        }
                      }}
                    >
                      <IconComponent iconName="BadgeCheck" size={14} /> Approve
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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

      {/* View User Modal */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconComponent iconName="X" size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{displayRole(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.address ? JSON.stringify(selectedUser.address) : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.cityId || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconComponent iconName="X" size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">Super Admin</option>
                    <option value="WarehouseStaff">Warehouse Staff</option>
                    <option value="DeliveryStaff">Delivery Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input
                    type="text"
                    value={editForm.addressLine1}
                    onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address, building number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input
                    type="text"
                    value={editForm.addressLine2}
                    onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apartment, suite, unit (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Postal/ZIP code"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconComponent iconName="X" size={20} />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete the user <strong>{selectedUser.name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. The user's orders will be preserved.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
