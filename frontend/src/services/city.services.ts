import axiosInstance from "@/axiosConfig";

export type City = {
  id: number;
  name: string;
  isMainCity?: number;
};

export const getAllCities = async (): Promise<City[]> => {
  const resp = await axiosInstance.get("/api/city");
  // Backend returns { success: true, data: rows }
  return resp.data?.data || [];
};
