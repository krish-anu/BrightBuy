// src/services/chart.services.ts
import axiosInstance from "@/axiosConfig";

export interface MonthlySales {
  month: string;
  totalOrders: number;
  totalSales: number;
}
export interface CategoryProducts {
  categoryId: number;
  categoryName: string;
  productCount: number;
}

export const getMonthlySales = async (): Promise<MonthlySales[]> => {
  try {
    const response = await axiosInstance.get("/api/chart/salesbymonth");
    if (response.data.success) {
      // Convert totalSales from string to number
      return response.data.data.map((item: any) => ({
        month: item.month,
        totalOrders: item.totalOrders,
        totalSales: parseFloat(item.totalSales),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    return [];
  }
};

export const maincategoryproducts = async (): Promise<CategoryProducts[]> => {
  try {
    const response = await axiosInstance.get("/api/chart/maincategoryproducts");

    if (response.data.success) {
      return response.data.data.map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        productCount: item.productCount,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching main category products:", error);
    return [];
  }
};
