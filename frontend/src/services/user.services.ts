import axiosInstance from "../axiosConfig";

export const getAllUsers = async () => {
  try {
    console.log("Hyyyyy");

    const response = await axiosInstance.get("/api/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};
