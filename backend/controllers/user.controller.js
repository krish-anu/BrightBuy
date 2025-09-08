const db=require("../models");
const ApiError = require("../utils/ApiError");
const User = db.user;



const getUserDeliveryInfo = async (req, res, next) => {
    try {
        const userInfo = await User.findByPk(req.user.id, {
            attributes:['id','name','email','address','phone','cityId','createdAt']
        })
        if (!userInfo) throw new ApiError('User not found', 404);
        res.status(200).json({success:true,data:userInfo})
    } catch (error) {
        next(error)
    }
};


// to implement
const updateUserInfo = async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
};
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "address",
        "phone",
        "cityId",
        "createdAt",
      ],
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
module.exports = {
    getUserDeliveryInfo,
    updateUserInfo,
    getAllUsers
}


