const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, purchaseController.getAllPurchases);
router.get("/doc_number/:doc_number", authMiddleware, purchaseController.getPurchaseByDocNumber);
router.get("/date/:date", authMiddleware, purchaseController.getPurchasesByDate);
router.post("/", purchaseController.createPurchase);
router.put("/:doc_number", purchaseController.cancelPurchase);
router.delete("/:doc_number", purchaseController.deletePurchase);

module.exports = router;
