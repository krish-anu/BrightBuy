import axiosInstance from "@/axiosConfig";
const totalLowStock = async () => {
  try {
    const totLow = await axiosInstance.get("/api/variant/totlowstock");
    // console.log("totLow:", totLow.data.data);
    
    return totLow.data.data
    }catch(error){
        console.log("Can not fetch number of low stock items: ",error);  
    }

}

const updateVariant = async (variantId: number | string, payload: any) => {
    try {
        const resp = await axiosInstance.put(`/api/variant/${variantId}`, payload);
        return resp.data;
    } catch (error) {
        console.error('Error updating variant:', error);
        throw error;
    }
};

const deleteVariant = async (variantId: number | string) => {
    try {
        const resp = await axiosInstance.delete(`/api/variant/${variantId}`);
        return resp.data;
    } catch (error) {
        console.error('Error deleting variant:', error);
        throw error;
    }
};

const getVariant = async (variantId: number | string) => {
    try {
        const resp = await axiosInstance.get(`/api/variant/${variantId}`);
        // Normalize to { success, data } for callers
        return { success: resp.data?.success ?? true, data: resp.data?.data ?? resp.data };
    } catch (error) {
        // If 404 returned, axios will throw; detect and return null so UI can handle missing variant
        const e: any = error;
        if (e && e.response && e.response.status === 404) {
            return null;
        }
        console.error('Error fetching variant:', error);
        throw error;
    }
};

export { totalLowStock, updateVariant, deleteVariant, getVariant };