const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, saleController.getAllSales);
router.get("/doc_number/:doc_number", authMiddleware, saleController.getSaleByDocNumber);
router.get("/date/:date", authMiddleware, saleController.getSalesByDate);
router.post("/", saleController.createSale);
router.put("/:doc_number", saleController.cancelSale);
router.delete("/:doc_number", saleController.deleteSale);

module.exports = router;
