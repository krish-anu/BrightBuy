const db=require("../models")
const Order=db.order

const getTotalRevenue=async (req,res,next)=>{
        try{
            const totalRevenue=await Order.sum("totalPrice")

            res.status(200).json({success:true,data:totalRevenue})

        }catch(error){
            next(error)
        }
}

module.exports={getTotalRevenue}