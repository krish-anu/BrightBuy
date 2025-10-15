import React, { useEffect, useState } from 'react';
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
  estimatedDelivery?: string; // <-- make optional
  deliveredAt?: string;
}


// no local Order mock type required; we rely on API-provided fields

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

const DeliveryStatus: React.FC = () => {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deliveriesList, setDeliveriesList] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const IconComponent: React.FC<IconComponentProps> = ({
    iconName,
    size = 20,
  }) => {
    const Icon = LucideIcons[iconName] as unknown as React.FC<
      React.SVGProps<SVGSVGElement>
    >;
    return Icon ? (
      <Icon width={size} height={size} />
    ) : (
      <LucideIcons.Circle width={size} height={size} />
    );
  };

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

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleString() : "N/A";
  };

  const safeNumber = (value: any): number => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
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

  const stringifyAddress = (value: any): string => {
    if (value == null) return 'No address';
    if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); value = parsed; } catch (_) { return value; }
    }
    if (typeof value === 'object') {
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

  // Map API delivery row to UI Delivery shape (keeps mapping logic in one place)
  const mapApiDeliveryToUI = (r: any) => {
    const raw = (r.status || '').toString().toLowerCase();
    let uiStatus: Delivery['status'] = 'assigned';
    if (raw === 'shipped' || raw === 'pending' || raw === 'assigned' || raw === '') uiStatus = 'assigned';
    if (raw === 'delivered') uiStatus = 'delivered';
    if (raw === 'cancelled' || raw === 'failed') uiStatus = 'failed';
    if (raw === 'shipped') uiStatus = 'in_transit';

    return {
      id: String(r.id),
      orderId: String(r.orderId),
      status: uiStatus,
      customerAddress: stringifyAddress(r.deliveryAddress ?? r.shippingAddress ?? r.address ?? 'No address'),
      customerPhone: r.customerPhone || r.phone || 'No phone',
      estimatedDelivery: r.estimatedDelivery || r.estimatedDeliveryDate || undefined,
      deliveredAt: r.deliveryDate || undefined,
      orderTotal: safeNumber(r.orderTotal ?? r.totalPrice ?? 0),
    } as Delivery & { orderTotal?: number };
  };

  // using API fields (orderTotal, customerPhone) directly; no local mock lookup

  useEffect(() => {
    const loadAssigned = async () => {
      setLoading(true);
      setFetchError(null);
      // show current token payload (if any) to help troubleshoot role/token issues
      try {
        const tokenPayload = (await import('../../services/auth.services')).getCurrentUserFromToken();
        setCurrentUser(tokenPayload);
      } catch (e) { setCurrentUser(null); }

      const resp = await getAssignedDeliveries();
      if (resp.success) {
        const rows = resp.data.map((r: any) => mapApiDeliveryToUI(r));
        setDeliveriesList(rows as any);
      } else {
        console.warn('Failed to load assigned deliveries:', resp.error, resp.status);
        // Show friendly error for auth/permission issues
        if (resp.status === 401) setFetchError('Unauthorized — please login');
        else if (resp.status === 403) setFetchError('Forbidden — your account does not have DeliveryStaff access');
        else setFetchError(String(resp.error || 'Failed to fetch deliveries'));
        // fallback: no data
        setDeliveriesList([]);
      }
      setLoading(false);
    };
    loadAssigned();
  }, []);

  // handled by API call in the Update Status button; old handler removed

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Update Delivery Status
        </h1>
        <p className="text-gray-600 mt-2">
          Update the status of your assigned deliveries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Deliveries
          </h3>
          <div className="space-y-4">
            {fetchError ? (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded">{fetchError}. {currentUser ? `Token payload: ${JSON.stringify(currentUser)}` : ''}</div>
            ) : (
              (loading ? [] : deliveriesList)
                .filter(d => d.status !== 'delivered')
                .map((delivery) => {
                  return (
                    <div
                      key={delivery.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDelivery?.id === delivery.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{delivery.id}</h4>
                          <p className="text-sm text-gray-500">Order: {delivery.orderId}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-2 mb-1">
                          <IconComponent iconName="MapPin" size={14} />
                          <span className="truncate">{delivery.customerAddress}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <IconComponent iconName="DollarSign" size={14} />
                          <span>{formatCurrencyUSD((delivery as any).orderTotal ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Status Update Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Update Status
          </h3>

          {selectedDelivery ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedDelivery.id}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <IconComponent iconName="Package" size={14} />
                    <span>Order: {selectedDelivery.orderId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconComponent iconName="MapPin" size={14} />
                    <span>{selectedDelivery.customerAddress}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconComponent iconName="Phone" size={14} />
                    <span>{selectedDelivery.customerPhone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconComponent iconName="Clock" size={14} />
                    <span>
                      Est: {formatDate(selectedDelivery.estimatedDelivery)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                >
                  <option value="">Select new status...</option>
                  {selectedDelivery.status === "assigned" && (
                    <option value="in_transit">
                      Start Delivery (In Transit)
                    </option>
                  )}
                  {selectedDelivery.status === "in_transit" && (
                    <>
                      <option value="delivered">Mark as Delivered</option>
                      <option value="failed">Mark as Failed</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any delivery notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={!statusUpdate}
                  onClick={async () => {
                    if (!selectedDelivery) return;
                    try {
                      const resp = await updateDeliveryStatusForStaff(Number(selectedDelivery.id), statusUpdate as any);
                      if (!resp.success) {
                        alert(resp.error || 'Failed to update status');
                        return;
                      }
                      const updated = resp.data;
                      // Re-fetch assigned deliveries to ensure UI is consistent with server
                      const refreshed = await getAssignedDeliveries();
                      if (refreshed.success) {
                        const rows = refreshed.data.map((r: any) => mapApiDeliveryToUI(r));
                        setDeliveriesList(rows as any);
                        // update selected delivery reference from refreshed data
                        const sel = rows.find((d: any) => d.id === String(updated.id));
                        setSelectedDelivery(sel || null);
                      } else {
                        // Fallback: patch the local state if refresh failed
                        const mappedUpdated = mapApiDeliveryToUI(updated);
                        setDeliveriesList(prev => prev.map(d => d.id === String(mappedUpdated.id) ? { ...d, ...mappedUpdated } : d));
                        setSelectedDelivery(prev => prev && prev.id === String(mappedUpdated.id) ? { ...prev, ...mappedUpdated } : prev);
                      }
                      setStatusUpdate('');
                      alert('Status updated');
                    } catch (err: any) {
                      console.error('Status update failed', err);
                      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to update status';
                      alert(serverMsg);
                    }
                  }}
                >
                  Update Status
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setSelectedDelivery(null)}
                >
                  Cancel
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-700 mb-3">
                  Quick Actions
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                    <IconComponent iconName="Navigation" size={16} />
                    <span className="ml-2 text-sm">Get Directions</span>
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                    <IconComponent iconName="Phone" size={16} />
                    <span className="ml-2 text-sm">Call Customer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <IconComponent iconName="Package" size={48} />
              <p className="mt-4">Select a delivery to update its status</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {deliveriesList.filter((d: Delivery) => d.status === 'assigned').length}
            </div>
            <div className="text-sm text-blue-700">Assigned</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {deliveriesList.filter((d: Delivery) => d.status === 'in_transit').length}
            </div>
            <div className="text-sm text-yellow-700">In Transit</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {deliveriesList.filter((d: Delivery) => d.status === 'delivered').length}
            </div>
            <div className="text-sm text-green-700">Delivered</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {deliveriesList.filter((d: Delivery) => d.status === 'failed').length}
            </div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStatus;
