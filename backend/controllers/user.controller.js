const db = require("../models");
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
        "city",
        "createdAt",
      ],
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
module.exports = { getAllUsers };
