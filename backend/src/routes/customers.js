const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, customerController.getAllCustomers);
router.get("/name/:name", authMiddleware, customerController.getCustomerByName);
router.get("/id/:id", authMiddleware, customerController.getCustomerByPk);
router.put("/:id", customerController.editCustomer);
router.post("/", customerController.createCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
