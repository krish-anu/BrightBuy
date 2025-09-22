import axiosInstance   from "@/axiosConfig";
const totalLowStock=async ()=>{
    try{
    const totLow= await axiosInstance.get("/api/variant/totlowstock")
    console.log("totLow:", totLow.data.data);
    
    return totLow.data.data
    }catch(error){
        console.log("Can not fetch number of low stock items: ",error);  
    }

}

export {totalLowStock}