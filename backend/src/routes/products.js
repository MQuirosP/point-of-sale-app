const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const auditService = require("../services/auditService");

router.get("/", authMiddleware, productController.getAllProducts);
router.get("/int_code/:int_code", authMiddleware, productController.getProductByIntCode);
router.get("/name/:name", authMiddleware, productController.getProductByName);
router.get("/id/:id", authMiddleware, productController.getProductByPk);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:int_code", productController.deleteProduct);

module.exports = router;
