import axiosInstance from "@/axiosConfig";

export type Address = {
  id: number;
  userId: number;
  line1: string;
  line2?: string | null;
  cityId: number | null;
  postalCode?: string | null;
  isDefault: number; // 1 or 0
};

export const listAddresses = async (): Promise<Address[]> => {
  const resp = await axiosInstance.get('/api/users/addresses');
  return resp.data?.data || [];
};

export const addAddress = async (payload: Omit<Address, 'id' | 'userId'> & { isDefault?: number }) => {
  const resp = await axiosInstance.post('/api/users/addresses', payload);
  return resp.data;
};

export const updateAddress = async (id: number, payload: Partial<Omit<Address, 'id' | 'userId'>>) => {
  const resp = await axiosInstance.put(`/api/users/addresses/${id}`, payload);
  return resp.data;
};

export const deleteAddress = async (id: number) => {
  const resp = await axiosInstance.delete(`/api/users/addresses/${id}`);
  return resp.data;
};

export const makeDefaultAddress = async (id: number) => {
  const resp = await axiosInstance.post(`/api/users/addresses/${id}/default`);
  return resp.data;
};
