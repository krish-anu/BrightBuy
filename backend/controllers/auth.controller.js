const db=require("../models")
const User=db.user
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, address, phone, city } = req.body;
    console.log("req.body", req.body);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Sequelize
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      address,
      phone,
      city,
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Sequelize findOne
    const user = await User.findOne({ where: { email } });
   
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
   
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );
     console.log("Hiiiiiiiiiiiiii", token); 

    res.status(200).json({ token, role: user.role, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// controllers/auth.controller.js

const logoutUser = async (req, res) => {
  try {
    // Since JWTs are stateless, we can't "invalidate" them server-side by default
    // The logout action is mostly handled on the client side by deleting the token
    // You can still send a response to indicate success

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllUsers= async(req,res)=>{
  
}

module.exports = { registerUser, loginUser, logoutUser };
