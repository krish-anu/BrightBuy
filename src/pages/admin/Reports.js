import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { reports, chartData } from '../../data/mockData';
import * as LucideIcons from 'lucide-react';

const Reports = () => {
  const IconComponent = ({ iconName, size = 24 }) => {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive business insights and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${reports.salesSummary.totalRevenue}</p>
              <p className="text-sm text-green-600 mt-1">+12.5% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <IconComponent iconName="DollarSign" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${reports.salesSummary.averageOrderValue}</p>
              <p className="text-sm text-blue-600 mt-1">+5.2% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <IconComponent iconName="ShoppingCart" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{reports.salesSummary.totalOrders}</p>
              <p className="text-sm text-purple-600 mt-1">+8.1% from last month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <IconComponent iconName="Package" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Product</p>
              <p className="text-lg font-bold text-gray-900">{reports.salesSummary.topSellingProduct}</p>
              <p className="text-sm text-orange-600 mt-1">Best seller this month</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <IconComponent iconName="TrendingUp" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <select className="text-sm border border-gray-300 rounded px-3 py-1">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.orderStatusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {chartData.orderStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory Analytics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Total Products</span>
              <span className="text-lg font-bold text-gray-900">{reports.inventoryStats.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-gray-700">Low Stock Items</span>
              <span className="text-lg font-bold text-yellow-600">{reports.inventoryStats.lowStockItems}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-gray-700">Total Inventory Value</span>
              <span className="text-lg font-bold text-green-600">${reports.inventoryStats.totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Delivery Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-gray-700">Assigned Deliveries</span>
              <span className="text-lg font-bold text-blue-600">{reports.deliveryStats.assigned}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-gray-700">In Transit</span>
              <span className="text-lg font-bold text-yellow-600">{reports.deliveryStats.inTransit}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-gray-700">Delivered</span>
              <span className="text-lg font-bold text-green-600">{reports.deliveryStats.delivered}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-sm font-medium text-gray-700">Failed Deliveries</span>
              <span className="text-lg font-bold text-red-600">{reports.deliveryStats.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Categories Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.productCategories}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
              {chartData.productCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
