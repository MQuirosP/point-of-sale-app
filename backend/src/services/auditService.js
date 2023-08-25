const { AuditDocument, AuditItem } = require('./../database/models');

module.exports = {
  createAuditDocument: async (date, consecutive) => {
    const newAuditDocument = await AuditDocument.create({
      doc_number: '', // Será generado automáticamente
      date,
      auditId: consecutive // Asegúrate de asignar el valor correcto al campo de la tabla
    });

    return newAuditDocument;
  },

  createAuditItem: async (auditDocumentId, auditDocumentDocNumber, item) => {
    const newAuditItem = await AuditItem.create({
      ...item,
      doc_number: auditDocumentDocNumber,
    });

    return newAuditItem;
  },

  getAllAudits: async () => {
    const audits = await AuditDocument.findAll({
      include: [{ model: AuditItem, as: 'auditItems' }]
    });
    return audits;
  },

  getAuditByDocNumber: async (docNumber) => {
    const audit = await AuditDocument.findOne({
      where: { doc_number: docNumber },
      include: [{ model: AuditItem, as: 'auditItems' }]
    });
    return audit;
  }
};
