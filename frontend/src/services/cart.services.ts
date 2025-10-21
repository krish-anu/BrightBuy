import axiosInstance from '../axiosConfig';

export type CartItemPayload = {
  variantId: number;
  quantity?: number;
  selected?: boolean;
  unitPrice?: number;
};

export const listCart = async () => {
  const resp = await axiosInstance.get('/api/cart');
  return resp.data?.data || [];
};

export const addToCart = async (payload: CartItemPayload) => {
  const resp = await axiosInstance.post('/api/cart', payload);
  return resp.data;
};

export const updateCartQuantity = async (id: number, quantity: number) => {
  const resp = await axiosInstance.put(`/api/cart/${id}/quantity`, { quantity });
  return resp.data;
};

export const updateCartSelected = async (id: number, selected: boolean) => {
  const resp = await axiosInstance.put(`/api/cart/${id}/selected`, { selected });
  return resp.data;
};

export const deleteCartItem = async (id: number) => {
  const resp = await axiosInstance.delete(`/api/cart/${id}`);
  return resp.data;
};

export const clearCart = async () => {
  const resp = await axiosInstance.delete(`/api/cart`);
  return resp.data;
};
