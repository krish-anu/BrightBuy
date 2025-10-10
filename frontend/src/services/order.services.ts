import axiosInstance from "@/axiosConfig";

// TypeScript interfaces for orders
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // From joins
  SKU: string;
  variantName: string;
  price: number;
  stockQnt: number;
  productId: number;
  productName: string;
}

export interface Order {
  id: number;
  userId: number;
  deliveryMode: 'Standard Delivery' | 'Store Pickup';
  deliveryAddress?: string;
  orderDate: string;
  estimatedDeliveryDate?: string;
  totalPrice: number;
  deliveryCharge: number;
  paymentMethod: 'CreditCard' | 'CashOnDelivery' | 'Stripe';
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  // Additional fields from joins
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
}

type StatsResponse = {
  totalOrders: number;
  totalRevenue: string;
  categoryWiseOrders: any;
  orderStatusOverview: {
    Pending: number;
    Confirmed: number;
    Shipped: number;
    Delivered: number;
    Cancelled: number;
  };
};

// Get all orders
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await axiosInstance.get<OrdersResponse>("/api/order/");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Get orders with pagination
export const getOrdersPaginated = async (
  page: number = 1, 
  limit: number = 10,
  status?: string,
  search?: string
): Promise<OrdersResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search })
    });
    
    const response = await axiosInstance.get<OrdersResponse>(`/api/order/paginated?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching paginated orders:", error);
    throw error;
  }
};

// Get single order by ID
export const getOrderById = async (orderId: number): Promise<Order> => {
  try {
    const response = await axiosInstance.get<{success: boolean; data: Order}>(`/api/order/${orderId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: number, status: string): Promise<Order> => {
  try {
    const response = await axiosInstance.patch<{success: boolean; data: Order}>(
      `/api/order/update/${orderId}`,
      { status }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// Get total revenue
export const getTotalRevenue = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalRevenue");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    throw error;
  }
};

// Get total orders count
export const getTotalOrders = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalOrders");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total orders:", error);
    throw error;
  }
};

// Get order statistics
export const getOrderStats = async (): Promise<StatsResponse> => {
  try {
    const response = await axiosInstance.get("/api/order/stats");
    console.log("res", response.data.data.orderStatusOverview);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    throw error;
  }
};
