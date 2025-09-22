const express = require("express");
const router = express.Router();
const { getSalesByMonth } = require("../controllers/chart.controller");

router.get("/salesbymonth", getSalesByMonth);

module.exports = router;
