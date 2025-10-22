import axiosInstance from '@/axiosConfig';

export const assignStaffToDelivery = async (deliveryId: number, staffId: number) => {
  try {
    const response = await axiosInstance.patch(`/api/delivery/${deliveryId}/assignStaff`, { staffId });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error assigning staff to delivery:', error);
    // Normalize error
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.response?.data?.error || (error as any)?.message || 'Assignment failed';
    return { success: false, error: errMsg };
  }
};

export const getAssignedDeliveries = async () => {
  try {
    const response = await axiosInstance.get('/api/delivery/assigned');
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error fetching assigned deliveries:', error);
    const status = (error as any)?.response?.status;
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to fetch deliveries';
    return { success: false, error: errMsg, status };
  }
};

export const updateDeliveryStatusForStaff = async (deliveryId: number, status: 'in_transit' | 'delivered' | 'failed') => {
  try {
    const response = await axiosInstance.patch(`/api/delivery/${deliveryId}/status`, { status });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error updating delivery status:', error);
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to update status';
    return { success: false, error: errMsg };
  }
};

export const getDeliveryAssignmentSummary = async () => {
  try {
    const response = await axiosInstance.get('/api/delivery/assignment/summary');
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error fetching delivery assignment summary:', error);
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to fetch assignment summary';
    return { success: false, error: errMsg };
  }
};

export const estimatedDeliveryDate = async (
  orderId: number | null = null,
  deliveryAddressId: number | null = null,
  deliveryMode?: string,
  hasOutOfStock?: boolean
) => {
  try {
    const response = await axiosInstance.get('/api/delivery/deliveyDate', {
      params: { orderId, deliveryAddressId, deliveryMode, hasOutOfStock },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error fetching estimated delivery date:', error);
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to fetch estimated date';
    return { success: false, error: errMsg };
  }
};