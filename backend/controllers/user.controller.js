const db=require("../models");
const ApiError = require("../utils/ApiError");
const User = db.user;



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

    getAllUsers
}


