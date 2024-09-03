const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/", auditController.getAllAudits);
router.get("/:doc_number", auditController.getAuditByDocNumber);
router.post("/", auditController.createAudit);

module.exports = router;
