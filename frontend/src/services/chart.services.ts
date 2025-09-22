// src/services/chart.services.ts
import axiosInstance from "@/axiosConfig";

export interface MonthlySales {
  month: string;
  totalOrders: number;
  totalSales: number;
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
