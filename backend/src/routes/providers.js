const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");

router.get("/", providerController.getAllProviders);
router.get("/name/:name", providerController.getProviderByName);
router.get("/id/:id", providerController.getProviderByPk);
router.put("/:id", providerController.editProvider);
router.post("/", providerController.createProvider);
router.delete("/:id", providerController.deleteProvider);

module.exports = router;
