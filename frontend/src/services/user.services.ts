import axiosInstance from "../axiosConfig";

export const getAllUsers = async () => {
    try {
        console.log("Fetching all users");
        const response = await axiosInstance.get("/api/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const updateUser = async (userId: number, userData: any) => {
    try {
        const response = await axiosInstance.put(`/api/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

export const deleteUser = async (userId: number) => {
    try {
        const response = await axiosInstance.delete(`/api/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};   

export const getDeliveryStaff = async () => {
    try {
        const response = await axiosInstance.get('/api/users/delivery-staff');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching delivery staff:', error);
        throw error;
    }
};

export const approveUser = async (userId: number) => {
    try {
        const response = await axiosInstance.patch(`/api/users/${userId}/approve`);
        return response.data;
    } catch (error) {
        console.error('Error approving user:', error);
        throw error;
    }
};