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
import { getReportsData, getInventoryStats, getQuarterlySales, getTopProducts, getUpcomingDeliveryEstimates, getTopSellingProduct, getCustomerSummaries } from '../../services/reports.services';
import type { ReportsData } from '../../services/reports.services';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

const IconComponent: React.FC<IconComponentProps> = ({
  iconName,
  size = 24,
}) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

const Reports: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [quarterlySales, setQuarterlySales] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [topProducts, setTopProducts] = useState<any>(null);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<any[]>([]);
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
      // Fetch additional reports in parallel
      const [qs, tp, ud, cs] = await Promise.all([
        getQuarterlySales(selectedYear),
        getTopProducts(undefined, undefined, 10),
        getUpcomingDeliveryEstimates(),
        getCustomerSummaries()
      ]);
      // Fallback: if backend didn't return top products, compute top product client-side
      let topProductsFallback = tp;
      if (!topProductsFallback || !Array.isArray(topProductsFallback.products) || topProductsFallback.products.length === 0) {
        try {
          const clientTop = await getTopSellingProduct();
          topProductsFallback = { startDate: undefined, endDate: undefined, limit: 10, products: [{ productId: 'client-side', productName: clientTop.name, totalSold: clientTop.sales }] };
        } catch (e) {
          console.warn('Client-side top product calculation failed', e);
        }
      }
      setReportsData(reports);
      setInventoryStats(inventory);
      setQuarterlySales(qs);
  setTopProducts(topProductsFallback);
  setCustomerSummaries(Array.isArray(cs) ? cs : []);
      setUpcomingDeliveries(ud || []);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('Failed to load reports data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when selectedYear changes
  useEffect(() => {
    loadReportsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

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
        <h1 className="text-3xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive business insights and analytics
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <button onClick={loadReportsData} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Refresh</button>
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

      {/* Unified Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Order Status Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
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

        {/* Orders by Category */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Category</h3>
          {reportsData && (
            <div className="mb-2 text-xs text-gray-500">Categories found: {reportsData.categoryWiseOrders?.length || 0}</div>
          )}
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reportsData && Array.isArray(reportsData.categoryWiseOrders) && reportsData.categoryWiseOrders.length > 0 ?
                  reportsData.categoryWiseOrders
                    .filter((cat: any) => (Number(cat.orderCount) || Number(cat.count) || 0) > 0)
                    .map((cat: any, index: number) => {
                      const orderCount = Number(cat.orderCount) || Number(cat.count) || 0;
                      return {
                        name: cat.categoryName || cat.name || 'Unknown',
                        value: orderCount,
                        actualValue: orderCount,
                        color: `hsl(${index * 72}, 70%, 60%)`
                      };
                    }) :
                  [{ name: 'No Data', value: 1, actualValue: 0, color: '#E5E7EB' }]
                }
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {reportsData && Array.isArray(reportsData.categoryWiseOrders) && reportsData.categoryWiseOrders.length > 0 ?
                  reportsData.categoryWiseOrders
                    .filter((cat: any) => (Number(cat.orderCount) || Number(cat.count) || 0) > 0)
                    .map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 60%)`} />
                    )) : <Cell key="no-data" fill="#E5E7EB" />}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Orders']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-600">
            {reportsData && Array.isArray(reportsData.categoryWiseOrders) && reportsData.categoryWiseOrders.length > 0 ? (
              (() => {
                const categoriesWithOrders = reportsData.categoryWiseOrders.filter((c: any) => (Number(c.orderCount) || 0) > 0);
                const categoriesWithoutOrders = reportsData.categoryWiseOrders.filter((c: any) => (Number(c.orderCount) || 0) === 0);
                return (
                  <div className="bg-blue-50 p-2 rounded">
                    <p>Showing {categoriesWithOrders.length} categories with orders{categoriesWithoutOrders.length > 0 ? ` (${categoriesWithoutOrders.length} without orders)` : ''}.</p>
                    {categoriesWithoutOrders.length > 0 && (
                      <p className="mt-1 text-gray-500">No orders: {categoriesWithoutOrders.map((c: any) => c.categoryName || c.name).join(', ')}</p>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center bg-gray-50 p-3 rounded">No category data available yet</div>
            )}
          </div>
        </div>

        {/* Inventory Analytics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><span className="text-sm font-medium text-gray-700">Total Products</span><span className="text-lg font-bold text-gray-900">{inventoryStats ? inventoryStats.totalVariants || 0 : 0}</span></div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded"><span className="text-sm font-medium text-gray-700">Low Stock Items</span><span className="text-lg font-bold text-yellow-600">{inventoryStats ? inventoryStats.lowStockItems || 0 : 0}</span></div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded"><span className="text-sm font-medium text-gray-700">Total Inventory Value</span><span className="text-lg font-bold text-green-600">${inventoryStats ? (inventoryStats.totalInventoryValue || 0).toLocaleString() : '0'}</span></div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products (Period)</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            {topProducts && Array.isArray(topProducts.products) && topProducts.products.length > 0 ? (
              topProducts.products.slice(0, Math.max(5, topProducts.products.length)).map((p: any) => (
                <li key={p.productId} className="flex justify-between">
                  <span>{p.productName}</span>
                  <span className="text-sm text-gray-600">{p.totalSold} units</span>
                </li>
              ))
            ) : (
              <div className="text-gray-500">No top product data available</div>
            )}
          </ol>
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deliveries</h3>
          <div className="text-sm space-y-2">
            {upcomingDeliveries && upcomingDeliveries.length > 0 ? (
              upcomingDeliveries.slice(0, 12).map((o: any) => (
                <div key={o.orderId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Order #{o.orderId}</div>
                    <div className="text-xs text-gray-600">{o.customerName} — Est: {o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}</div>
                  </div>
                  <div className="text-sm text-gray-700">{o.orderStatus}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No upcoming deliveries</div>
            )}
          </div>
        </div>

        {/* Quarterly Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quarterly Sales ({quarterlySales?.year || selectedYear})</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded-md p-1 text-sm"
              >
                {(() => {
                  const current = new Date().getFullYear();
                  const years: number[] = [];
                  for (let i = 0; i < 6; i++) years.push(current - i);
                  return years.map(y => <option key={y} value={y}>{y}</option>);
                })()}
              </select>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {quarterlySales && Array.isArray(quarterlySales.quarters) && quarterlySales.quarters.length > 0 ? (
              quarterlySales.quarters.map((q: any) => (
                <li key={q.quarter} className="flex justify-between">
                  <span>{q.quarter}</span>
                  <span className="font-medium">LKR {Number(q.totalSales || 0).toLocaleString()}</span>
                </li>
              ))
            ) : (
              <div className="text-gray-500">No data available for quarterly sales</div>
            )}
          </ul>
        </div>

        {/* Order Status Breakdown (summary counts) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded"><span className="text-sm font-medium text-gray-700">Pending Orders</span><span className="text-lg font-bold text-yellow-600">{reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Pending || 0 : 0}</span></div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded"><span className="text-sm font-medium text-gray-700">Shipped Orders</span><span className="text-lg font-bold text-purple-600">{reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Shipped || 0 : 0}</span></div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded"><span className="text-sm font-medium text-gray-700">Delivered Orders</span><span className="text-lg font-bold text-green-600">{reportsData && reportsData.orderStatusOverview ? reportsData.orderStatusOverview.Delivered || 0 : 0}</span></div>
          </div>
        </div>

        {/* Customer-wise Order Summary (full width) */}
        <div className="bg-white rounded-lg shadow-md p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer-wise Order Summary</h3>
            <span className="text-sm text-gray-500">Top {Math.min(customerSummaries.length, 10) || 0} customers</span>
          </div>
          {customerSummaries && customerSummaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4 text-right">Orders</th>
                    <th className="py-2 pr-4 text-right">Total Spent</th>
                    <th className="py-2 pr-4">Last Order</th>
                    <th className="py-2 pr-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSummaries.slice(0, 10).map((c: any) => {
                        const s = (c.aggPaymentStatus || '').toString();
                        const badgeClass = (v: string) => {
                          const t = v.toLowerCase();
                          if (t === 'paid') return 'bg-green-100 text-green-700 border-green-200';
                          if (t === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                          return 'bg-gray-100 text-gray-700 border-gray-200';
                        };
                        return (
                          <tr key={c.customerId} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 font-medium text-gray-900">{c.customerName || '—'}</td>
                            <td className="py-2 pr-4 text-gray-700">{c.customerEmail || '—'}</td>
                            <td className="py-2 pr-4 text-right">{Number(c.totalOrders || 0)}</td>
                            <td className="py-2 pr-4 text-right">LKR {Number(c.totalSpent || 0).toLocaleString()}</td>
                            <td className="py-2 pr-4 text-gray-700">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—'}</td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded-full border text-xs ${badgeClass(s || 'Pending')}`}>{s || 'Pending'}</span>
                            </td>
                          </tr>
                        );
        })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No customer data available yet</div>
          )}
        </div>

        {/* Business Summary (full width) */}
        <div className="bg-white rounded-lg shadow-md p-6 xl:col-span-3">
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
              <p className="text-sm opacity-90 mt-1">{reportsData ? `${reportsData.topProduct.sales} units sold` : 'No sales data'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
