import React, { useState, useEffect } from 'react';
import { getAllOrders, getAssignedOrders } from '../../services/order.services';
import { getDeliveryStaff } from '../../services/user.services';
import { assignStaffToDelivery } from '../../services/delivery.services';
import { getCurrentUserFromToken } from '../../services/auth.services';
import type { Order } from '../../services/order.services';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

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

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab] = useState<'all' | 'shipped' | 'assigned'>('all');
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<'all' | 'Store Pickup' | 'Standard Delivery'>('all');
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableDeliveryStaff, setAvailableDeliveryStaff] = useState<any[]>([]);
  const [assigningDelivery, setAssigningDelivery] = useState(false);
  const [deliveryToAssign, setDeliveryToAssign] = useState<{ deliveryId?: number; orderId?: number } | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Enhanced filtering and sorting
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Decide which endpoint to call based on token role to avoid 403 Forbidden
      const current = getCurrentUserFromToken();
      const role = (current?.role || '').toString().toLowerCase();
      let ordersData: Order[] = [];
      if (role === 'admin' || role === 'superadmin') {
        ordersData = await getAllOrders();
      } else if (role === 'warehousestaff' || role === 'deliverystaff' || role.includes('delivery')) {
        // warehouse and delivery staff should only get their assigned orders
        ordersData = await getAssignedOrders();
      } else {
        // Other roles are not allowed to list all orders; surface a helpful message and return empty
        setError('You do not have permission to list all orders.');
        setOrders([]);
        setLoading(false);
        return;
      }
      console.log('Loaded orders data:', ordersData);
      console.log('Order statuses:', ordersData.map(order => ({ id: order.id, status: order.status })));
      setOrders(ordersData);
      // If admin and activeTab is shipped, load shipped orders too
      if (role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin') {
        // lazy load shipped orders
        // lazy load placeholder - no-op
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      // Distinguish forbidden from other errors
      const e: any = err;
      if (e?.message === 'Forbidden' || e?.response?.status === 403) {
        setError('You do not have permission to view orders. Contact an admin.');
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Load shipped orders (admin only)
  const loadShippedOrders = async () => {
    try {
      setLoading(true);
      const axiosInstance = (await import('../../axiosConfig')).default;
      const response = await axiosInstance.get('/api/order/shipped');
      setShippedOrders(response.data?.data || []);
    } catch (err) {
      console.error('Error loading shipped orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modal state for view/edit
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');

  const getAllowedNextStatuses = (current: string | undefined) => {
    const curr = current ? current.charAt(0).toUpperCase() + current.slice(1).toLowerCase() : 'Pending';
    switch (curr) {
      case 'Pending':
        return ['Confirmed', 'Cancelled'];
      case 'Confirmed':
          return ['Shipped', 'Cancelled'];
      case 'Shipped':
        return ['Delivered'];
      default:
        return [];
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || 'Unknown Customer').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || order.status.toLowerCase() === filterStatus.toLowerCase();
    
    // Date filtering
    const orderDate = new Date(order.orderDate || order.createdAt);
    const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo);

    // Delivery mode filtering: respect 'all' or match string (order.deliveryMode may be object/string)
    let matchesDeliveryMode = true;
    if (deliveryModeFilter !== 'all') {
      const mode = typeof order.deliveryMode === 'string' ? order.deliveryMode : (order.deliveryMode && JSON.stringify(order.deliveryMode)) || '';
      matchesDeliveryMode = (mode || '').toLowerCase() === deliveryModeFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesDeliveryMode;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.orderDate || a.createdAt).getTime();
        bValue = new Date(b.orderDate || b.createdAt).getTime();
        break;
      case 'total':
        aValue = a.totalPrice;
        bValue = b.totalPrice;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.orderDate || a.createdAt).getTime();
        bValue = new Date(b.orderDate || b.createdAt).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const displayedOrders = activeTab === 'shipped'
    ? shippedOrders
    : (activeTab === 'assigned' ? filteredOrders.filter(o => o.deliveryId) : filteredOrders);

  // Pagination calculations (use displayedOrders which respects tab)
  const totalCount = displayedOrders.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, dateFrom, dateTo, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  // Safely stringify possible object fields (addresses, names) returned as JSON
  const stringifyField = (v: any) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v);
    } catch (_) {
      return String(v);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Track and manage customer orders</p>
        
        {/* Order Statistics */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconComponent iconName="Package" size={20} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconComponent iconName="CheckCircle" size={20} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Delivered</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => o.status.toLowerCase() === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <IconComponent iconName="Clock" size={20} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => ['pending', 'confirmed'].includes(o.status.toLowerCase())).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IconComponent iconName="DollarSign" size={20} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${orders.length > 0 
                      ? orders.reduce((sum, order) => {
                          const price = Number(order.totalPrice) || 0;
                          return sum + price;
                        }, 0).toFixed(2)
                      : '0.00'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center justify-between">
        

        {/* Delivery mode selector */}
        <div>
          <label className="text-sm mr-2">Delivery Mode:</label>
          <select
            className="px-3 py-1 border border-gray-300 rounded"
            value={deliveryModeFilter}
            onChange={e => setDeliveryModeFilter(e.target.value as 'all' | 'Store Pickup' | 'Standard Delivery')}
          >
            <option value="all">All</option>
            <option value="Store Pickup">Store Pickup</option>
            <option value="Standard Delivery">Standard Delivery</option>
          </select>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            {/* Processing removed */}
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <div className="relative">
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="From Date"
            />
            <div className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">From</div>
          </div>
          
          <div className="relative">
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="To Date"
            />
            <div className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">To</div>
          </div>
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as ['date' | 'total' | 'status', 'asc' | 'desc'];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="total-desc">Highest Amount</option>
            <option value="total-asc">Lowest Amount</option>
            <option value="status-asc">Status A-Z</option>
            <option value="status-desc">Status Z-A</option>
          </select>
          
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={itemsPerPage}
            onChange={e => handleItemsPerPageChange(Number(e.target.value))}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        
        {/* Active Filters Display */}
        {(searchTerm || filterStatus || dateFrom || dateTo) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {searchTerm}
                <button
                  type="button"
                  className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-600 hover:bg-blue-200"
                  onClick={() => setSearchTerm('')}
                >
                  <IconComponent iconName="X" size={12} />
                </button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {filterStatus}
                <button
                  type="button"
                  className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-600 hover:bg-green-200"
                  onClick={() => setFilterStatus('')}
                >
                  <IconComponent iconName="X" size={12} />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                From: {dateFrom}
                <button
                  type="button"
                  className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-600 hover:bg-purple-200"
                  onClick={() => setDateFrom('')}
                >
                  <IconComponent iconName="X" size={12} />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                To: {dateTo}
                <button
                  type="button"
                  className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-orange-600 hover:bg-orange-200"
                  onClick={() => setDateTo('')}
                >
                  <IconComponent iconName="X" size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

        {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <IconComponent iconName="AlertCircle" size={48} />
              <p className="text-red-600 mt-2">{error}</p>
              <button 
                onClick={loadOrders}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <IconComponent iconName="Package" size={48} />
              <p className="text-gray-600 mt-2">No orders found</p>
              {searchTerm || filterStatus ? (
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Orders will appear here once customers place them</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedOrders.slice(startIndex, endIndex).filter(Boolean).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(typeof order.customer?.name === 'object') ? stringifyField(order.customer?.name) : (order.customer?.name || 'Unknown Customer')}</div>
                      <div className="text-sm text-gray-500">{(typeof order.customer?.email === 'object') ? stringifyField(order.customer?.email) : (order.customer?.email || 'No email')}</div>
                      {order.deliveryAddress && (
                        <div className="text-xs text-gray-400 mt-1">{typeof order.deliveryAddress === 'object' ? stringifyField(order.deliveryAddress) : order.deliveryAddress}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(Number(order.totalPrice) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor((order.status || 'pending').toLowerCase())}`}>
                        {order.status 
                          ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                          : 'Pending'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.orderDate || order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                          onClick={() => { setSelectedOrder(order); setViewModalOpen(true); }}
                        >
                          <IconComponent iconName="Eye" size={16} />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Update Status"
                          onClick={() => { 
                            const titleCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
                            setSelectedOrder(order); 
                            const allowed = getAllowedNextStatuses(order.status);
                            setEditStatus(allowed.length ? allowed[0] : titleCase(order.status)); 
                            setEditModalOpen(true); 
                          }}
                        >
                          <IconComponent iconName="Edit" size={16} />
                        </button>
                        { (getCurrentUserFromToken()?.role === 'Admin' || getCurrentUserFromToken()?.role === 'SuperAdmin') && (
                          // Only allow assignment when order status is Shipped
                          (() => {
                            const isShipped = (order.status || '').toString().toLowerCase() === 'shipped';
                            return (
                              <button
                                className={`${isShipped ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`}
                                title={isShipped ? 'Assign Delivery' : 'Assign Delivery (only available when order is Shipped)'}
                                onClick={async () => {
                                  if (!isShipped) return; // prevent action when not shipped
                                  // Guard client-side: ensure current token belongs to Admin or SuperAdmin
                                  const current = getCurrentUserFromToken();
                                  if (!current || (current.role !== 'Admin' && current.role !== 'SuperAdmin')) {
                                    alert('You are not authorized to assign deliveries. Please login as Admin.');
                                    return;
                                  }
                                  // Open assign modal for this order
                                  try {
                                    setDeliveryToAssign({ orderId: order.id, deliveryId: order.deliveryId });
                                    setAssignModalOpen(true);
                                    // fetch delivery staff
                                    const staff = await getDeliveryStaff();
                                    setAvailableDeliveryStaff(staff || []);
                                  } catch (err: any) {
                                    console.error('Failed to fetch delivery staff', err);
                                    const status = err?.response?.status || err?.status;
                                    if (status === 401) alert('Unauthorized — please login');
                                    else if (status === 403) alert('Forbidden — you do not have permission to perform assignments');
                                    else alert('Failed to fetch delivery staff');
                                  }
                                }}
                              >
                                <IconComponent iconName="Truck" size={16} />
                              </button>
                            );
                          })()
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <IconComponent iconName="ChevronLeft" size={16} />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <IconComponent iconName="ChevronRight" size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* View Order Modal */}
      {viewModalOpen && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order #{selectedOrder.id}</h3>
              <button onClick={() => { setViewModalOpen(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{selectedOrder.customer?.email || 'No email'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map(it => (<li key={it.id}>{it.variantName} x {it.quantity}</li>)) : <li>No items</li>}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total</label>
                <p className="mt-1 text-sm text-gray-900">${(Number(selectedOrder.totalPrice) || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal - change status flow */}
      {editModalOpen && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Order Status</h3>
              <button onClick={() => { setEditModalOpen(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Change Status</label>
                <div className="mt-2">
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                    {getAllowedNextStatuses(selectedOrder?.status).length === 0 ? (
                      <option value={selectedOrder?.status || 'Pending'}>{selectedOrder?.status || 'Pending'}</option>
                    ) : (
                      getAllowedNextStatuses(selectedOrder?.status).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="mt-3 flex space-x-2">
                    <button disabled={isUpdatingStatus} onClick={async () => {
                      try {
                        setIsUpdatingStatus(true);
                        const { updateOrderStatus } = await import('@/services/order.services');
                        const updated = await updateOrderStatus(selectedOrder.id, editStatus);

                        if (updated && updated.id) {
                          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                        } else {
                          // If backend did not return updated order, reload list to ensure UI consistency
                          await loadOrders();
                        }

                        setEditModalOpen(false);
                        setSelectedOrder(null);
                      } catch (err: any) {
                        console.error('Failed to update order status', err);
                        const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to update status';
                        alert(`Failed to update status: ${serverMsg}`);
                        // Reload orders to ensure UI isn't stale
                        await loadOrders();
                        setEditModalOpen(false);
                        setSelectedOrder(null);
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }} className={`px-3 py-1 ${isUpdatingStatus ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded`}>{isUpdatingStatus ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => { setEditModalOpen(false); setSelectedOrder(null); }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Modal (Admin only) */}
      {assignModalOpen && deliveryToAssign && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Delivery Staff</h3>
              <button onClick={() => { setAssignModalOpen(false); setDeliveryToAssign(null); }} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Delivery Staff</label>
                <div className="mt-2">
                  <select className="w-full px-3 py-2 border rounded" onChange={(e) => setAvailableDeliveryStaff(prev => prev.map(s => ({...s, _selected: s.id === Number(e.target.value)})))}>
                    <option value="">-- Select --</option>
                    {availableDeliveryStaff.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.email})</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex space-x-2">
                    <button onClick={async () => {
                      const selected = availableDeliveryStaff.find(s => s._selected);
                      if (!selected) { alert('Please select a staff'); return; }
                      try {
                        setAssigningDelivery(true);
                        // Use deliveryId if present, otherwise pass the orderId — backend will create a delivery record when missing
                        const idToUse = deliveryToAssign.deliveryId || deliveryToAssign.orderId;
                        const resp = await assignStaffToDelivery(Number(idToUse), selected.id);
                        // If the service returns an error-like response, surface it
                        if (resp && resp.success === false) {
                          let msg = 'Failed to assign delivery staff';
                          if (resp.error) {
                            if (typeof resp.error === 'string') {
                              msg = resp.error;
                            } else if (typeof resp.error === 'object' && 'message' in resp.error) {
                              msg = (resp.error as { message?: string }).message || msg;
                            }
                          }
                          alert(msg);
                        } else {
                          // refresh lists
                          await loadOrders();
                          await loadShippedOrders();
                          setAssignModalOpen(false);
                          setDeliveryToAssign(null);
                        }
                      } catch (err: any) {
                        console.error('Assign failed', err);
                        const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to assign delivery staff';
                        alert(serverMsg);
                      } finally {
                        setAssigningDelivery(false);
                      }
                    }} className={`px-3 py-1 ${assigningDelivery ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded`}>{assigningDelivery ? 'Assigning...' : 'Assign'}</button>
                  <button onClick={() => { setAssignModalOpen(false); setDeliveryToAssign(null); }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
