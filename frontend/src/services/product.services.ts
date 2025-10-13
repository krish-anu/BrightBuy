import axiosInstance from "@/axiosConfig";

// Interface for pagination response
interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export const getAllProducts = async () => {
  try {
    console.log('Calling products API...');
    const response = await axiosInstance.get('/api/product');
    console.log('Product service response:', response);
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.data;
    console.log('Product service data:', data);
    return data;
  } catch (error) {
    console.error('Error in getAllProducts service:', error);
    throw error;
  }
}

// Interface for inventory statistics
interface InventoryStats {
  totalProducts: number;
  totalVariants: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
}

export const getProductsPaginated = async (page: number = 1, limit: number = 10): Promise<PaginationResponse<any>> => {
  try {
    console.log(`Calling paginated products API - page: ${page}, limit: ${limit}`);
    const response = await axiosInstance.get(`/api/product/paginated?page=${page}&limit=${limit}`);
    console.log('Paginated product service response:', response);
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch paginated products');
    }
    const data = response.data;
    console.log('Paginated product service data:', data);
    return data;
  } catch (error) {
    console.error('Error in getProductsPaginated service:', error);
    throw error;
  }
}

export const getInventoryStats = async (): Promise<{ success: boolean; data: InventoryStats }> => {
  try {
    console.log('Calling inventory stats API...');
    const response = await axiosInstance.get('/api/product/stats');
    console.log('Inventory stats service response:', response);
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch inventory stats');
    }
    const data = response.data;
    console.log('Inventory stats service data:', data);
    return data;
  } catch (error) {
    console.error('Error in getInventoryStats service:', error);
    throw error;
  }
}

export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosInstance.post('/api/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export const uploadImageForEntity = async (file: File, entity: string, entityId: string | number) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('entity', entity);
    formData.append('entityId', String(entityId));
    const response = await axiosInstance.post('/api/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image for entity:', error);
    throw error;
  }
}

export const setVariantImage = async (variantId: number | string, imageURL: string) => {
  try {
    const response = await axiosInstance.patch(`/api/variant/${variantId}/image`, { imageURL });
    return response.data;
  } catch (error) {
    console.error('Error setting variant image:', error);
    throw error;
  }
}

export const addProduct = async (productData: any) => {
  try {
    const response = await axiosInstance.post('/api/product', productData);
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

// Brands
export const getBrands = async (): Promise<{ id: number; name: string }[]> => {
  try {
    const resp = await axiosInstance.get('/api/product/brands');
    return resp.data.data || [];
  } catch (err) {
    console.error('Error fetching brands:', err);
    return [];
  }
};

export const createBrand = async (name: string) => {
  try {
    const resp = await axiosInstance.post('/api/product/brands', { name });
    return resp.data.data;
  } catch (err) {
    console.error('Error creating brand:', err);
    throw err;
  }
};