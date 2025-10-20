import axiosInstance from "@/axiosConfig";

export type AddressUpsertPayload = {
  line1: string;
  line2?: string | null;
  cityId: number;
  postalCode?: string | null;
  isDefault?: boolean;
};

export const listAddresses = async () => {
  const resp = await axiosInstance.get("/api/users/addresses");
  // backend returns { success: true, data: rows }
  return resp.data?.data || [];
};

export const addAddress = async (payload: AddressUpsertPayload) => {
  const resp = await axiosInstance.post("/api/users/addresses", payload);
  // returns { success: true, id, data: rows }
  return resp.data;
};

export const updateAddress = async (id: number, payload: AddressUpsertPayload) => {
  const resp = await axiosInstance.put(`/api/users/addresses/${id}`, payload);
  // returns { success: true, data: rows }
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
