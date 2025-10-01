import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getReportsData, getInventoryStats } from '../../services/reports.services';
import type { ReportsData } from '../../services/reports.services';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

const IconComponent: React.FC<IconComponentProps> = ({ iconName, size = 24 }) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

const Reports: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reports data
  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reports, inventory] = await Promise.all([
        getReportsData(),
        getInventoryStats()
      ]);
      setReportsData(reports);
      setInventoryStats(inventory);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('Failed to load reports data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadReportsData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconComponent iconName="AlertCircle" size={48} />
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={loadReportsData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
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
              <p className="text-2xl font-bold text-gray-900">
                ${reportsData ? reportsData.totalRevenue.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-green-600 mt-1">All time revenue</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <IconComponent iconName="DollarSign" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryStats ? inventoryStats.totalVariants || 0 : 0}
              </p>
              <p className="text-sm text-blue-600 mt-1">Product variants in stock</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <IconComponent iconName="Package2" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportsData ? reportsData.totalOrders : 0}
              </p>
              <p className="text-sm text-purple-600 mt-1">All time orders</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <IconComponent iconName="ShoppingCart" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Product</p>
              <p className="text-lg font-bold text-gray-900">
                {reportsData ? reportsData.topProduct.name : 'No data'}
              </p>
              <p className="text-sm text-orange-600 mt-1">
                {reportsData ? `${reportsData.topProduct.sales} units sold` : 'No sales data'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <IconComponent iconName="TrendingUp" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Status Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsData && reportsData.orderStatusOverview ? Object.entries(reportsData.orderStatusOverview).map(([status, count]) => ({
              status,
              count: Number(count) || 0
            })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value}`, 'Orders']} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Wise Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Category</h3>
          {/* Debug info */}
          {reportsData && (
            <div className="mb-2 text-xs text-gray-500">
              Categories found: {reportsData.categoryWiseOrders?.length || 0}
            </div>
          )}
          
          {/* Show the chart */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportsData && Array.isArray(reportsData.categoryWiseOrders) && reportsData.categoryWiseOrders.length > 0 ? 
                  reportsData.categoryWiseOrders
                    .filter((category: any) => {
                      const orderCount = Number(category.orderCount) || Number(category.count) || 0;
                      return orderCount > 0; // Only show categories with orders
                    })
                    .map((category: any, index: number) => {
                      const orderCount = Number(category.orderCount) || Number(category.count) || 0;
                      return {
                        name: category.categoryName || category.name || 'Unknown',
                        value: orderCount,
                        actualValue: orderCount,
                        color: `hsl(${index * 72}, 70%, 60%)` // Use 72 degrees for better color distribution
                      };
                    }) : 
                  [{ name: 'No Data', value: 1, actualValue: 0, color: '#E5E7EB' }]
                }
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {reportsData && Array.isArray(reportsData.categoryWiseOrders) && reportsData.categoryWiseOrders.length > 0 ? 
                  reportsData.categoryWiseOrders
                    .filter((category: any) => {
                      const orderCount = Number(category.orderCount) || Number(category.count) || 0;
                      return orderCount > 0;
                    })
                    .map((category: any, index: number) => {
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${index * 72}, 70%, 60%)`} 
                        />
                      );
                    }) : 
                  <Cell key="no-data" fill="#E5E7EB" />
                }
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [value, 'Orders']} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Show detailed message */}
          <div className="mt-4 text-sm text-gray-600">
            {(!reportsData || !Array.isArray(reportsData.categoryWiseOrders) || reportsData.categoryWiseOrders.length === 0) ? (
              <div className="text-center bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-700">No category data available</p>
                <p className="text-xs mt-1">This could mean:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>• No orders have been placed yet</li>
                  <li>• Products are not assigned to categories</li>
                  <li>• Orders don't contain products with category associations</li>
                </ul>
                <p className="text-xs mt-2 text-blue-600">
                  Add some orders or check product categorization to see data here.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs">
                  {(() => {
                    const categoriesWithOrders = reportsData.categoryWiseOrders.filter((cat: any) => (Number(cat.orderCount) || 0) > 0);
                    const categoriesWithoutOrders = reportsData.categoryWiseOrders.filter((cat: any) => (Number(cat.orderCount) || 0) === 0);
                    
                    return `Showing ${categoriesWithOrders.length} categories with orders${categoriesWithoutOrders.length > 0 ? ` (${categoriesWithoutOrders.length} categories have no orders yet)` : ''}.`;
                  })()}
                </p>
                
                {/* List categories without orders */}
                {(() => {
                  const categoriesWithoutOrders = reportsData.categoryWiseOrders.filter((cat: any) => (Number(cat.orderCount) || 0) === 0);
                  if (categoriesWithoutOrders.length > 0) {
                    return (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">Categories without orders:</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {categoriesWithoutOrders.map((cat: any) => cat.categoryName || cat.name).join(', ')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
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
              <span className="text-lg font-bold text-gray-900">
                {inventoryStats ? inventoryStats.totalVariants || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-gray-700">Low Stock Items</span>
              <span className="text-lg font-bold text-yellow-600">
                {inventoryStats ? inventoryStats.lowStockItems || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-gray-700">Total Inventory Value</span>
              <span className="text-lg font-bold text-green-600">
                ${inventoryStats ? (inventoryStats.totalInventoryValue || 0).toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-gray-700">Pending Orders</span>
              <span className="text-lg font-bold text-yellow-600">
                {reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Pending || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-gray-700">Processing Orders</span>
              <span className="text-lg font-bold text-blue-600">
                {reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Processing || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span className="text-sm font-medium text-gray-700">Shipped Orders</span>
              <span className="text-lg font-bold text-purple-600">
                {reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Shipped || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-gray-700">Delivered Orders</span>
              <span className="text-lg font-bold text-green-600">
                {reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Delivered || 0 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
            <h4 className="text-lg font-semibold mb-2">Revenue Performance</h4>
            <p className="text-3xl font-bold">${reportsData ? reportsData.totalRevenue.toFixed(0) : '0'}</p>
            <p className="text-sm opacity-90 mt-1">Total revenue generated</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
            <h4 className="text-lg font-semibold mb-2">Order Volume</h4>
            <p className="text-3xl font-bold">{reportsData ? reportsData.totalOrders : '0'}</p>
            <p className="text-sm opacity-90 mt-1">Total orders processed</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
            <h4 className="text-lg font-semibold mb-2">Best Seller</h4>
            <p className="text-lg font-bold">{reportsData ? reportsData.topProduct.name : 'No data'}</p>
            <p className="text-sm opacity-90 mt-1">
              {reportsData ? `${reportsData.topProduct.sales} units sold` : 'No sales data'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
