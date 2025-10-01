import axiosInstance from "@/axiosConfig";

// types/order.ts
type OrderStats = {
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

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


const getTotalRevenue = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalRevenue");
    // console.log("Response data:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    throw error;
  }
};

const getTotalOrders = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalOrders");
    // console.log("Response data:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total orders:", error);
    throw error;
  }
};
// services/order.services.ts
export const getOrderStats = async (): Promise<StatsResponse> => {
  const response = await axiosInstance.get("/api/order/stats");
  console.log("res",response.data.data.orderStatusOverview);
  
  return response.data.data; // backend returns the full stats object

};


export { getTotalRevenue, getTotalOrders };
