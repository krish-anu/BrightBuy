import axiosInstance from "@/axiosConfig";

// Fetch top product directly from backend aggregation endpoint (declared early so usable in getReportsData)
export const getDBTopProduct = async () => {
  try {
    const resp = await getTopProducts(undefined, undefined, 1); // backend enforces minimum 5 internally
    const first = resp.products && resp.products.length > 0 ? resp.products[0] : null;
    if (!first) return { name: 'No sales data', sales: 0 };
    return { name: first.productName, sales: Number(first.totalSold) || 0 };
  } catch (err) {
    console.warn('DB top product fetch failed, will fallback to client calc', err);
    return { name: 'No sales data', sales: 0 };
  }
};

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

      // Prefer DB-derived top product (aggregated in backend) with fallback to client-side calculation
      let topProduct = await getDBTopProduct();
      if (!topProduct || topProduct.sales === 0) {
        try {
          const fallback = await getTopSellingProduct();
          if (fallback && fallback.sales > 0) topProduct = fallback;
        } catch (e) {
          // swallow fallback errors
        }
      }

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

// Fetch top product directly from backend aggregation endpoint
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

// New report service functions
export const getQuarterlySales = async (year?: number) => {
  try {
    const params: any = {};
    if (year) params.year = year;
    const response = await axiosInstance.get('/api/order/reports/quarterly', { params });
    const data = response.data.data || { year: year || new Date().getFullYear(), quarters: [] };

    // Ensure we always return four quarters (Q1..Q4). If backend returned none
    // (e.g. no orders for that year), provide zeros so the UI can render consistently.
    const defaultQuarters = [
      { quarter: 'Q1', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q2', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q3', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q4', totalOrders: 0, totalSales: 0 }
    ];

    if (!Array.isArray(data.quarters) || data.quarters.length === 0) {
      return { year: data.year || year || new Date().getFullYear(), quarters: defaultQuarters };
    }

    // Normalize quarter objects (ensure numeric fields exist)
    const quarters = defaultQuarters.map(d => {
      const found = data.quarters.find((q: any) => String(q.quarter).toUpperCase() === d.quarter);
      return found ? {
        quarter: String(found.quarter),
        totalOrders: Number(found.totalOrders) || 0,
        totalSales: Number(found.totalSales) || 0
      } : d;
    });

    return { year: data.year || year || new Date().getFullYear(), quarters };
  } catch (error) {
    console.error('Error fetching quarterly sales:', error);
    return { year: year || new Date().getFullYear(), quarters: [
      { quarter: 'Q1', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q2', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q3', totalOrders: 0, totalSales: 0 },
      { quarter: 'Q4', totalOrders: 0, totalSales: 0 }
    ] };
  }
}

export const getTopProducts = async (startDate?: string, endDate?: string, limit = 10) => {
  try {
    const params: any = { limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosInstance.get('/api/order/reports/top-products', { params });
    const data = response.data?.data || { startDate, endDate, limit, products: [] };
    let products: any[] = Array.isArray(data.products) ? [...data.products] : [];

    // Ensure at least 5 products are returned for UI consistency
    if (products.length < 5) {
      try {
        // Prefer paginated endpoint to avoid fetching too much
        const prodResp = await axiosInstance.get('/api/product/paginated?page=1&limit=50');
        const allProducts: any[] = prodResp.data?.data || [];
        const existingIds = new Set(products.map(p => p.productId));
        for (const p of allProducts) {
          if (products.length >= 5) break;
          if (!existingIds.has(p.id)) {
            products.push({ productId: p.id, productName: p.name, totalSold: 0 });
          }
        }
      } catch (padErr) {
        console.warn('Padding top products failed, falling back to /api/product', padErr);
        try {
          const prodResp = await axiosInstance.get('/api/product');
          const allProducts: any[] = prodResp.data?.data || prodResp.data || [];
          const existingIds = new Set(products.map(p => p.productId));
          for (const p of allProducts) {
            if (products.length >= 5) break;
            if (!existingIds.has(p.id)) {
              products.push({ productId: p.id, productName: p.name, totalSold: 0 });
            }
          }
        } catch (padErr2) {
          console.warn('Fallback padding from /api/product also failed', padErr2);
        }
      }
    }

    return { startDate: data.startDate || startDate, endDate: data.endDate || endDate, limit: data.limit || limit, products };
  } catch (error) {
    console.error('Error fetching top products:', error);
    return { startDate, endDate, limit, products: [] };
  }
}

export const getCustomerSummaries = async () => {
  try {
    const response = await axiosInstance.get('/api/order/reports/customer-summary');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching customer summaries:', error);
    return [];
  }
}

export const getUpcomingDeliveryEstimates = async () => {
  try {
    const response = await axiosInstance.get('/api/order/reports/upcoming-deliveries');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching upcoming deliveries:', error);
    return [];
  }
}