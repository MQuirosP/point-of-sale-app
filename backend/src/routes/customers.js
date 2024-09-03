const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/", customerController.getAllCustomers);
router.get("/name/:name", customerController.getCustomerByName);
router.get("/id/:id", customerController.getCustomerByPk);
router.put("/:id", customerController.editCustomer);
router.post("/", customerController.createCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
