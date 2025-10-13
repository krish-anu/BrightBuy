import axiosInstance from "@/axiosConfig";

// TypeScript interfaces for reports
export interface ReportsData {
  totalRevenue: number;
  totalOrders: number;
  topProduct: {
    name: string;
    sales: number;
  };
  categoryWiseOrders: Array<{
    categoryName: string;
    orderCount: number;
  }>;
  orderStatusOverview: {
    Pending: number;
    Confirmed: number;
    Shipped: number;
    Delivered: number;
    Cancelled: number;
  };
  monthlySales: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
}

// Get comprehensive reports data
export const getReportsData = async (): Promise<ReportsData> => {
  try {
    // Fetch all required data in parallel
    const [totalRevenue, totalOrders, orderStats, categoryWiseOrders] = await Promise.all([
      getTotalRevenue(),
      getTotalOrders(),
      getOrderStats(),
      getCategoryWiseOrders()
    ]);

    console.log("Reports data debug:", {
      totalRevenue,
      totalOrders,
      orderStats,
      categoryWiseOrders
    });

    // Get top product from all orders (we'll calculate this from existing data)
    const topProduct = await getTopSellingProduct();

    return {
      totalRevenue: Number(totalRevenue) || 0,
      totalOrders: Number(totalOrders) || 0,
      topProduct,
      categoryWiseOrders: Array.isArray(categoryWiseOrders) ? categoryWiseOrders : [],
      orderStatusOverview: orderStats.orderStatusOverview,
      monthlySales: [] // We'll add this later if needed
    };
  } catch (error) {
    console.error("Error fetching reports data:", error);
    throw error;
  }
};

// Get total revenue
export const getTotalRevenue = async (): Promise<number> => {
  try {
    const response = await axiosInstance.get("/api/order/totalRevenue");
    return response.data.data || 0;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    return 0;
  }
};

// Get total orders count
export const getTotalOrders = async (): Promise<number> => {
  try {
    const response = await axiosInstance.get("/api/order/totalOrders");
    return response.data.data || 0;
  } catch (error) {
    console.error("Error fetching total orders:", error);
    return 0;
  }
};

// Get order statistics
export const getOrderStats = async () => {
  try {
    const response = await axiosInstance.get("/api/order/stats");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return {
      orderStatusOverview: {
        Pending: 0,
        Confirmed: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0
      }
    };
  }
};

// Get category wise orders
export const getCategoryWiseOrders = async () => {
  try {
    const response = await axiosInstance.get("/api/order/category");
    console.log("Category wise orders response:", response.data);
    const categoryData = response.data.data || [];
    
    // Return the category data as is
    return Array.isArray(categoryData) ? categoryData : [];
  } catch (error) {
    console.error("Error fetching category wise orders:", error);
    return [];
  }
};

// Get top selling product (we'll need to create this endpoint or calculate from existing data)
export const getTopSellingProduct = async () => {
  try {
    // For now, we'll get all orders and calculate the top product client-side
    // In production, this should be a dedicated backend endpoint
    const response = await axiosInstance.get("/api/order/");
    const orders = response.data.data || [];
    
    const productSales: { [key: string]: number } = {};
    
    // Calculate product sales from order items
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown Product';
          productSales[productName] = (productSales[productName] || 0) + item.quantity;
        });
      }
    });
    
    // Find the top selling product
    let topProduct = { name: 'No sales data', sales: 0 };
    Object.entries(productSales).forEach(([name, sales]) => {
      if (sales > topProduct.sales) {
        topProduct = { name, sales };
      }
    });
    
    return topProduct;
  } catch (error) {
    console.error("Error calculating top selling product:", error);
    return { name: 'No data available', sales: 0 };
  }
};

// Get inventory statistics
export const getInventoryStats = async () => {
  try {
    const response = await axiosInstance.get("/api/product/stats");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return {
      totalProducts: 0,
      totalVariants: 0,
      lowStockItems: 0,
      totalInventoryValue: 0
    };
  }
};