import axiosInstance from "@/axiosConfig";
const totalLowStock = async () => {
  try {
    const totLow = await axiosInstance.get("/api/variant/totlowstock");
    // console.log("totLow:", totLow.data.data);

    return totLow.data.data;
  } catch (error) {
    console.log("Can not fetch number of low stock items: ", error);
  }
};

const getProductByID = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/api/product/${id}`);
    console.log("Product by ID response:", response.data);
    return response.data;
  } catch (error) {
    console.log("Can not fetch product by ID: ", error);
  }
};
export { totalLowStock, getProductByID };
