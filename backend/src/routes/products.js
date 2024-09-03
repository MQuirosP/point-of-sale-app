const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getAllProducts);
router.get("/int_code/:int_code", productController.getProductByIntCode);
router.get("/name/:name", productController.getProductByName);
router.get("/id/:id", productController.getProductByPk);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:int_code", productController.deleteProduct);

module.exports = router;
