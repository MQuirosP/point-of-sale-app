const express = require("express");
const router = express.Router();
const excelReportsController = require("../controllers/excelReportsController");

router.post("/sales-report", excelReportsController.generateSalesReport);
router.post("/purchases-report", excelReportsController.generatePurchasesReport);

module.exports = router;
