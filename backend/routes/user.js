const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const {
	getAllUsers,
	updateUserById,
	deleteUser,
	getDeliveryStaff,
	getProfile,
	updateProfile,
	changePassword,
	approveUser,
	getPendingUsers,
} = require("../controllers/user.controller");

// Route to get the logged-in user's profile
router.get("/profile", verifyToken, getProfile);

// Route to update the logged-in user's profile
router.patch("/profile", verifyToken, updateProfile);

// Route to change password
router.post('/change-password', verifyToken, changePassword);


// Secure listing routes
router.get("/", verifyToken, getAllUsers);
router.get('/pending', verifyToken, authorizeRoles('SuperAdmin'), getPendingUsers);

// Admin: get list of delivery staff for assignment
const ROLES = require("../roles");
router.get('/delivery-staff', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getDeliveryStaff);
// Must be authenticated to list users

// Admin routes for user management
router.put("/:id", verifyToken, updateUserById);
router.delete("/:id", verifyToken, deleteUser);
router.patch('/:id/approve', verifyToken, authorizeRoles('SuperAdmin'), approveUser);

module.exports = router;
