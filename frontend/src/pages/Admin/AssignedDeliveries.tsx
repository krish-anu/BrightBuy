import React, { useState } from 'react';
import { getAssignedDeliveries, updateDeliveryStatusForStaff } from '../../services/delivery.services';
import * as LucideIcons from 'lucide-react';
import { formatCurrencyUSD } from '../../lib/utils';
// import type { Icon as LucideIcon } from 'lucide-react';

interface Delivery {
  id: string;
  orderId: string;
  status: "assigned" | "in_transit" | "delivered" | "failed";
  customerAddress: string;
  customerPhone: string;
  estimatedDelivery?: string; // <-- optional
  deliveredAt?: string;
  orderTotal?: number;
  staffName?: string;
}


const AssignedDeliveries: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [deliveriesList, setDeliveriesList] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const IconComponent: React.FC<{
    iconName: keyof typeof LucideIcons;
    size?: number;
  }> = ({ iconName, size = 20 }) => {
    const Icon = LucideIcons[iconName] as unknown as React.FC<
      React.SVGProps<SVGSVGElement>
    >;
    return Icon ? (
      <Icon width={size} height={size} />
    ) : (
      <LucideIcons.Circle width={size} height={size} />
    );
  };

  const filteredDeliveries = (loading ? [] : deliveriesList).filter((delivery: Delivery) => {
    const matchesSearch =
      delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "" || delivery.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Delivery["status"]) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  // safely coerce various API shapes into a number
  const safeNumber = (value: any): number => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // remove non-numeric characters (currency symbols, commas)
      const cleaned = value.replace(/[^0-9.-]+/g, '');
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof value === 'object') {
      if ('amount' in value) return safeNumber(value.amount);
      if ('total' in value) return safeNumber(value.total);
    }
    return 0;
  };

  // Safely turn address-like values into a readable string
  const stringifyAddress = (value: any): string => {
    if (value == null) return 'No address';
    if (typeof value === 'string') {
      // try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(value);
        value = parsed;
      } catch (_) {
        return value;
      }
    }
    if (typeof value === 'object') {
      // prefer common address fields
      const parts: string[] = [];
      const street = value.street || value.line1 || value.address || value.line_1 || value.lineOne;
      const city = value.city || value.town;
      const state = value.state || value.region;
      const zip = value.zipCode || value.postalCode || value.postcode || value.zip;
      if (street) parts.push(street);
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (zip) parts.push(zip);
      const out = parts.join(', ');
      return out || JSON.stringify(value);
    }
    return String(value);
  };

  // load assigned deliveries from API
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getAssignedDeliveries();
        if (resp.success) {
          const rows = resp.data.map((r: any) => ({
            id: String(r.id),
            orderId: String(r.orderId),
            status: ((r.status || '').toString().toLowerCase() === 'delivered' ? 'delivered' : (r.status || '').toString().toLowerCase() === 'shipped' ? 'in_transit' : (r.status || '').toString().toLowerCase() === 'failed' || (r.status || '').toString().toLowerCase() === 'cancelled' ? 'failed' : 'assigned') as Delivery['status'],
            customerAddress: stringifyAddress(r.deliveryAddress ?? r.shippingAddress ?? r.address ?? 'No address'),
            customerPhone: r.customerPhone || r.phone || 'No phone',
            estimatedDelivery: r.estimatedDelivery || r.estimatedDeliveryDate || undefined,
            deliveredAt: r.deliveryDate || undefined,
            orderTotal: safeNumber(r.orderTotal ?? r.totalPrice ?? 0),
            staffName: r.staffName || undefined,
          }));
          if (mounted) setDeliveriesList(rows);
        } else {
          if (mounted) setDeliveriesList([]);
        }
      } catch (e) {
        if (mounted) setDeliveriesList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const refreshList = async () => {
    setLoading(true);
    try {
      const resp = await getAssignedDeliveries();
      if (resp.success) {
        const rows = resp.data.map((r: any) => ({
          id: String(r.id),
          orderId: String(r.orderId),
          status: ((r.status || '').toString().toLowerCase() === 'delivered' ? 'delivered' : (r.status || '').toString().toLowerCase() === 'shipped' ? 'in_transit' : (r.status || '').toString().toLowerCase() === 'failed' || (r.status || '').toString().toLowerCase() === 'cancelled' ? 'failed' : 'assigned') as Delivery['status'],
          customerAddress: stringifyAddress(r.deliveryAddress ?? r.shippingAddress ?? r.address ?? 'No address'),
          customerPhone: r.customerPhone || r.phone || 'No phone',
          estimatedDelivery: r.estimatedDelivery || r.estimatedDeliveryDate || undefined,
          deliveredAt: r.deliveryDate || undefined,
          orderTotal: safeNumber(r.orderTotal ?? r.totalPrice ?? 0),
          staffName: r.staffName || undefined,
        }));
        setDeliveriesList(rows);
      } else {
        setDeliveriesList([]);
      }
    } catch (e) {
      setDeliveriesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: 'in_transit' | 'delivered' | 'failed') => {
    setUpdatingId(deliveryId);
    try {
      const resp = await updateDeliveryStatusForStaff(Number(deliveryId), newStatus);
      if (!resp.success) {
        console.error('Failed to update delivery status', resp.error);
      }
      // Refresh list so delivered items disappear
      await refreshList();
    } catch (err) {
      console.error('Error updating delivery status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Try to open tel: or sms: URIs and provide a clipboard fallback & UI notice so desktop users get feedback
  const tryOpenUriWithFallback = async (uri: string, fallbackText?: string) => {
    try {
      // Attempt navigation which on mobile should open phone/sms handler
      window.location.href = uri;
      // Also copy fallback text (phone number) to clipboard for desktop users
      if (fallbackText && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fallbackText);
      }
      setActionNotice('Opened phone app (or copied number to clipboard)');
    } catch (err) {
      // Clipboard or navigation failed — still attempt to copy if possible
      try {
        if (fallbackText && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fallbackText);
          setActionNotice('Number copied to clipboard');
        } else {
          setActionNotice('Action attempted — please try on a mobile device');
        }
      } catch (err2) {
        setActionNotice('Unable to open dialer or copy number');
      }
    }

    // Clear notice after 3 seconds
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCall = async (phone: string) => {
    const normal = (phone || '').replace(/[^+0-9]/g, '');
    if (!normal) {
      setActionNotice('No valid phone number');
      setTimeout(() => setActionNotice(null), 2000);
      return;
    }
    // Copy to clipboard first for desktop users, then attempt to open tel: URI
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(normal);
        setActionNotice('Number copied to clipboard');
      }
    } catch (err) {
      // ignore
    }
    // small delay to ensure clipboard action is complete for UX
    setTimeout(() => {
      tryOpenUriWithFallback(`tel:${normal}`, normal);
    }, 150);
  };

  const handleMessage = async (phone: string, deliveryId?: string) => {
    const normal = (phone || '').replace(/[^+0-9]/g, '');
    if (!normal) {
      setActionNotice('No valid phone number');
      setTimeout(() => setActionNotice(null), 2000);
      return;
    }
    const body = `Hello, this is BrightBuy regarding your delivery ${deliveryId ? `#${deliveryId}` : ''}`.trim();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(normal);
        setActionNotice('Number copied to clipboard');
      }
    } catch (err) {
      // ignore
    }
    setTimeout(() => {
      tryOpenUriWithFallback(`sms:${normal}?body=${encodeURIComponent(body)}`, normal);
    }, 150);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Assigned Deliveries
        </h1>
        <p className="text-gray-600 mt-2">Manage your delivery assignments</p>
      </div>
      {actionNotice && (
        <div className="mb-4 rounded-md bg-indigo-50 text-indigo-800 p-3">{actionNotice}</div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Delivery ID or Order ID..."
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
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          {/* <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <IconComponent iconName="MapPin" size={16} />
            <span className="ml-2">Route Optimizer</span>
          </button> */}
        </div>
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeliveries.map((delivery: Delivery) => {
          // order details aren't available from the API payload in this component; show orderTotal if present
          // show orderTotal if present (allow 0 values)
          const orderDetails = (delivery as any).orderTotal != null ? { id: delivery.orderId, total: Number((delivery as any).orderTotal) } : undefined;
          return (
            <div
              key={delivery.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {delivery.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Order: {delivery.orderId}
                  </p>
                  {delivery.staffName && (
                    <p className="text-sm text-gray-500">Assigned To: {delivery.staffName}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}
                >
                  {delivery.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <IconComponent iconName="MapPin" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Delivery Address
                    </p>
                    <p className="text-sm text-gray-600">
                      {delivery.customerAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <IconComponent iconName="Phone" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Customer Phone
                    </p>
                    <p className="text-sm text-gray-600">
                      {delivery.customerPhone}
                    </p>
                    
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <IconComponent iconName="Clock" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {delivery.status === "delivered"
                        ? "Delivered At"
                        : "Estimated Delivery"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(
                        delivery.deliveredAt ??
                          delivery.estimatedDelivery ??
                          "",
                      )}
                    </p>
                  </div>
                </div>

                {orderDetails && (
                  <div className="flex items-center space-x-3">
                    <IconComponent iconName="Package" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Order Value</p>
                      <p className="text-sm text-gray-600">{formatCurrencyUSD(Number(orderDetails.total) || 0)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {delivery.status === "assigned" && (
                    <button
                      onClick={() => handleUpdateStatus(delivery.id, 'in_transit')}
                      disabled={updatingId === delivery.id}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {updatingId === delivery.id ? 'Starting...' : 'Start Delivery'}
                    </button>
                  )}
                  {delivery.status === "in_transit" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                        disabled={updatingId === delivery.id}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-60"
                      >
                        {updatingId === delivery.id ? 'Updating...' : 'Mark Delivered'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'failed')}
                        disabled={updatingId === delivery.id}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-60"
                      >
                        {updatingId === delivery.id ? 'Updating...' : 'Mark Failed'}
                      </button>
                    </>
                  )}
                  {/* <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    <IconComponent iconName="Navigation" size={14} />
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    <IconComponent iconName="MessageCircle" size={14} />
                  </button> */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <IconComponent iconName="Clock" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {deliveriesList.filter((d: Delivery) => d.status === 'assigned').length}
              </div>
              <div className="text-sm text-gray-500">Pending Deliveries</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <IconComponent iconName="Truck" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {deliveriesList.filter((d: Delivery) => d.status === 'in_transit').length}
              </div>
              <div className="text-sm text-gray-500">In Transit</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <IconComponent iconName="CheckCircle" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {deliveriesList.filter((d: Delivery) => d.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedDeliveries;
