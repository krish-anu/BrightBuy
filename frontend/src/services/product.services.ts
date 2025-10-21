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

export const getAllProducts = async (categoryId?: number) => {
  try {
    console.log('Calling products API...');
    const response = await axiosInstance.get('/api/product', {
      params: categoryId ? { categoryId } : undefined,
    });
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

export const getProductsPaginated = async (page: number = 1, limit: number = 10, categoryId?: number): Promise<PaginationResponse<any>> => {
  try {
    console.log(`Calling paginated products API - page: ${page}, limit: ${limit}`);
    // Admin-oriented endpoint (variant-centric)
    const response = await axiosInstance.get(`/api/product/paginated`, {
      params: { page, limit, ...(categoryId ? { categoryId } : {}) },
    });
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

// Frontend storefront: one row per product with a representative variant
export const getProductsPaginatedFrontend = async (page: number = 1, limit: number = 10, categoryId?: number, parentCategoryId?: number): Promise<PaginationResponse<any>> => {
  try {
    console.log(`Calling frontend paginated products API - page: ${page}, limit: ${limit}`);
    const response = await axiosInstance.get(`/api/product/paginated/frontend`, {
      params: { page, limit, ...(categoryId ? { categoryId } : {}), ...(parentCategoryId ? { parentCategoryId } : {}) },
    });
    console.log('Frontend paginated product service response:', response);
    if (response.status !== 200) {
      throw new Error('Failed to fetch paginated products (frontend)');
    }
    const data = response.data;
    console.log('Frontend paginated product service data:', data);
    return data;
  } catch (error) {
    console.error('Error in getProductsPaginatedFrontend service:', error);
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

// Fetch a lightweight list of product names (deduped) for dropdowns.
// Uses the existing getAllProducts endpoint and extracts distinct names.
export const getProductNames = async (): Promise<string[]> => {
  try {
    const res = await getAllProducts();
    const rows = res?.data || [];
    const set = new Set<string>();
    for (const r of rows) {
      const pname = (r && (r.productName || r.name)) ? String(r.productName || r.name) : '';
      if (pname.trim()) {
        set.add(pname.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error('Error fetching product names:', err);
    return [];
  }
};

export const getProductByID = async (id: string | number) => {
  const res = await axiosInstance.get(`/api/product/${id}`);
  return res.data; // your API likely returns { success, data }
};

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

// ---------------- Attributes ----------------
export interface Attribute {
  id: number;
  name: string;
}

export const getAttributes = async (): Promise<Attribute[]> => {
  try {
    const resp = await axiosInstance.get('/api/attribute');
    return resp.data?.data || [];
  } catch (err) {
    console.error('Error fetching attributes:', err);
    return [];
  }
};

export const createAttribute = async (name: string): Promise<Attribute | null> => {
  try {
    if (!name.trim()) return null;
    const resp = await axiosInstance.post('/api/attribute', { name: name.trim() });
    if (resp.data && resp.data.success) {
      const rows = resp.data.data;
      // backend returns an array of attributes just inserted (per controller code)
      if (Array.isArray(rows) && rows.length > 0) return rows[0];
      return rows || null;
    }
    return null;
  } catch (err:any) {
    if (err?.response?.status === 409) {
      // attribute exists - refetch list to get id
      const list = await getAttributes();
      const found = list.find(a => a.name.toLowerCase() === name.toLowerCase());
      return found || null;
    }
    console.error('Error creating attribute:', err);
    return null;
  }
};