const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, auditController.getAllAudits);
router.get("/:doc_number", authMiddleware, auditController.getAuditByDocNumber);
router.post("/", auditController.createAudit);

module.exports = router;
