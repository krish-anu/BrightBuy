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
