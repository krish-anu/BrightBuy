import React, { useState } from 'react';
import { orders } from '../../../data/mockData';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

const IconComponent: React.FC<IconComponentProps> = ({ iconName, size = 20 }) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Track and manage customer orders</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconComponent iconName="Search" size={16} />
            </div>
          </div>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <IconComponent iconName="Download" size={16} />
            <span className="ml-2">Export Orders</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td>{order.id}</td>
                  <td>{order.customer.name}</td>
                  <td>{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td className="flex space-x-2">
                    <button title="View Details"><IconComponent iconName="Eye" size={16} /></button>
                    <button title="Update Status"><IconComponent iconName="Edit" size={16} /></button>
                    <button title="Assign Delivery"><IconComponent iconName="Truck" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
