import axiosInstance from "@/axiosConfig";

const getTotalRevenue = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalRevenue");
    console.log("Response data:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    throw error;
  }
};

const getTotalOrders = async () => {
  try {
    const response = await axiosInstance.get("/api/order/totalOrders");
    console.log("Response data:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching total orders:", error);
    throw error;
  }
};

export { getTotalRevenue, getTotalOrders };
