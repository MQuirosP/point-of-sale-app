const auditService = require("./../services/auditService");
const productService = require("./../services/productService");
const responseUtils = require("../utils/responseUtils");
const { appLogger } = require("../utils/logger");

async function createAudit(req, res) {
  try {
    const { username, consecutive, items } = req.body;

    console.log(req.body);
    const newAuditDocument = await auditService.createAuditDocument(
      username,
      consecutive
    );

    for (const item of items) {
      await auditService.createAuditItem(
        newAuditDocument.id,
        newAuditDocument.doc_number,
        item
      );
      item.quantity = Number(item.quantity);

      const productId = item.productId;
      const newQuantity = Number(item.quantity + item.adjusted_quantity);

      const productData = {
        quantity: newQuantity,
      }

      // Aquí puedes llamar a la función para actualizar las cantidades de productos
      await productService.updateProduct(productId, productData);
    }

    const response = {
      document: {
        ...newAuditDocument.toJSON(),
        items: items,
      },
    };

    responseUtils.sendSuccessResponse(res, response, 201);
  } catch (error) {
    appLogger.error(error);
    responseUtils.sendErrorResponse(res, { error: "An error occurred" }, 500);
  }
}

async function getAllAudits(req, res) {
  try {
    const audits = await auditService.getAllAudits();
    responseUtils.sendSuccessResponse(res, { documents: audits }, 200);
  } catch (error) {
    appLogger.error(error);
    responseUtils.sendErrorResponse(res, { error: "An error ocurred" }, 500);
  }
}

async function getAuditByDocNumber(req, res) {
  try {
    const { doc_number } = req.params;
    const audit = await auditService.getAuditByDocNumber(doc_number);
    if (!audit) {
      responseUtils.sendErrorResponse(res, { error: "Audit not found" }, 404);
    } else {
      responseUtils.sendSuccessResponse(res, { document: audit }, 200);
    }
  } catch (error) {
    appLogger.error(error);
    responseUtils.sendErrorResponse(res, { error: "An error ocurred" }, 500);
  }
}

module.exports = {
  createAudit,
  getAllAudits,
  getAuditByDocNumber,
};
