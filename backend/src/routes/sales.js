const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");

router.get("/", saleController.getAllSales);
router.get("/doc_number/:doc_number", saleController.getSaleByDocNumber);
router.get("/date/:date", saleController.getSalesByDate);
router.post("/", saleController.createSale);
router.put("/:doc_number", saleController.cancelSale);
router.delete("/:doc_number", saleController.deleteSale);

module.exports = router;
