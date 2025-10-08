const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const { getAllUsers, updateUserById, deleteUser } = require("../controllers/user.controller");

// ===================== SUPER ADMIN ROUTES =====================
// // Only super-admin can permit admins
// router.post(
//   "/permit-admin",
//   verifyToken,
//   authorizeRoles(ROLES.SUPER_ADMIN),
//   (req, res) => {
//     // Logic to approve new admin
    

//     res.json({ message: "Admin permitted successfully" });
//   }
// );

// // ===================== ADMIN ROUTES =====================
// // Admin can update product details
// router.put( 
//   "/products/:id",
//   verifyToken,
//   authorizeRoles(ROLES.ADMIN),
//   (req, res) => {
//     // Logic to update product details
//     res.json({ message: "Product updated successfully" });
//   }
// );

// // Admin can generate reports
// router.get(
//   "/reports",
//   verifyToken,
//   authorizeRoles(ROLES.ADMIN),
//   (req, res) => {
//     // Logic to generate reports
//     res.json({ message: "Reports generated" });
//   }
// );

// // ===================== DELIVERY STAFF ROUTES =====================
// // Delivery staff can see order details
// router.get(
//   "/orders",
//   verifyToken,
//   authorizeRoles(ROLES.DELIVERY),
//   (req, res) => {
//     // Logic to get orders
//     res.json({ message: "Order list" });
//   }
// );

// // Delivery staff can take and update order status
// router.put(
//   "/orders/:id",
//   verifyToken,
//   authorizeRoles(ROLES.DELIVERY),
//   (req, res) => {
//     // Logic to update order status
//     res.json({ message: "Order updated" });
//   }
// );

// // ===================== WAREHOUSE STAFF ROUTES =====================
// // Warehouse staff can update stock
// router.put(
//   "/stocks/:id",
//   verifyToken,
//   authorizeRoles(ROLES.WAREHOUSE),
//   (req, res) => {
//     // Logic to update stock
//     res.json({ message: "Stock updated" });
//   }
// );

// // Warehouse staff can manage stock (add/remove)
// router.post(
//   "/stocks",
//   verifyToken,
//   authorizeRoles(ROLES.WAREHOUSE),
//   (req, res) => {
//     // Logic to add new stock
//     res.json({ message: "Stock added" });
//   }
// );

router.get("/", getAllUsers);

// Admin routes for user management
router.put("/:id", updateUserById);
router.delete("/:id", deleteUser);

module.exports = router;
