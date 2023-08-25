const auditService = require("./../services/auditService");
const responseUtils = require("../utils/responseUtils");

async function createAudit(req, res) {
  try {
    const { date, consecutive, items } = req.body;

    const newAuditDocument = await auditService.createAuditDocument(
      date,
      consecutive
    );

    for (const item of items) {
      await auditService.createAuditItem(
        newAuditDocument.id,
        newAuditDocument.doc_number,
        item
      );
    }

    res.status(201).json({ message: "Audit created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
}

async function getAllAudits(req, res) {
  try {
    const audits = await auditService.getAllAudits();
    res.status(200).json(audits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

async function getAuditByDocNumber (req, res) {
  try {
    const { doc_number } = req.params;
    const audit = await auditService.getAuditByDocNumber(doc_number);
    if (!audit) {
      res.status(404).json({ message: 'Audit not found' });
    } else {
      res.status(200).json(audit);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

module.exports = {
  createAudit,
  getAllAudits,
  getAuditByDocNumber,
};
