import axiosInstance from "@/axiosConfig";

export const getAllCategories = async () => {
  try {
    const response = await axiosInstance.get("/api/category");
    console.log('Category service response:', response);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createCategory = async (name: string, parentId: number | null = null) => {
  try {
    const response = await axiosInstance.post('/api/category', { name, parentId });
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};
export const addProductsToCategory = async (categoryId: number, productIds: number[]) => {
  try {
    const response = await axiosInstance.post(
      `api/category/addProductsCategory`,
      {
        categoryId,
        productIds,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error adding products to category:", error);
    throw error;
  }
};
