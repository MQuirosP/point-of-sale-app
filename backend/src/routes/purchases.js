const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");

router.get("/", purchaseController.getAllPurchases);
router.get("/doc_number/:doc_number", purchaseController.getPurchaseByDocNumber);
router.get("/date/:date", purchaseController.getPurchasesByDate);
router.post("/", purchaseController.createPurchase);
router.put("/:doc_number", purchaseController.cancelPurchase);
router.delete("/:doc_number", purchaseController.deletePurchase);

module.exports = router;
