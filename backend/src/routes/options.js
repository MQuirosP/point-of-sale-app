const express = require("express");
const router = express.Router();
const optionsController = require("../controllers/optionsController");

router.get("/:id", optionsController.getOptions);
router.put("/:id", optionsController.updateOptions);

module.exports = router;
