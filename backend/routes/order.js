const {getTotalRevenue} =require("../controllers/order.controller")

const router = require('express').Router();
router.get("/totalRevenue",getTotalRevenue)


module.exports = router;