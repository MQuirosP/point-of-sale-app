const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, providerController.getAllProviders);
router.get("/name/:name", authMiddleware, providerController.getProviderByName);
router.get("/id/:id", authMiddleware, providerController.getProviderByPk);
router.put("/:id", providerController.editProvider);
router.post("/", providerController.createProvider);
router.delete("/:id", providerController.deleteProvider);

module.exports = router;
