import axiosInstance from "@/axiosConfig";

export const getAllProducts = async () => {
  const response = await axiosInstance.get('/api/product');
  if (response.status !== 200) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.data;
  return data;
}