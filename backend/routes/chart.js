const express = require("express");
const router = express.Router();
const { getSalesByMonth,mainCategoryProducts } = require("../controllers/chart.controller");

router.get("/salesbymonth", getSalesByMonth);
router.get("/maincategoryproducts", mainCategoryProducts);

module.exports = router;
