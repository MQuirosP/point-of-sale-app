require("dotenv").config();
const purchaseService = require("../services/purchaseService");
const { appLogger } = require("../utils/logger");
const responseUtils = require("../utils/responseUtils");
const productService = require("../services/productService");
const sequelize = require("../database/sequelize");
const { Purchase } = require("../database/models");

async function getAllPurchases(req, res) {
  try {
    const { date } = req.body;
    const purchases = await purchaseService.getAllPurchases();
    if (!purchases) {
      return responseUtils.sendErrorResponse(
        res,
        "There is not purchases to show"
      );
    } else {
      const purchasesView = purchases.map((purchase) => purchase.getView());
      responseUtils.sendSuccessResponse(res, { Purchases: purchasesView });
    }
  } catch (error) {
    appLogger.error("Error getting purchases", error);
    responseUtils.sendErrorResponse(res, "Error retrieving purchases");
  }
}

async function getPurchaseByDocNumber(req, res) {
  const { doc_number } = req.params;
  try {
    const purchase = await purchaseService.getPurchaseByDocNumber(doc_number);
    if (!purchase || purchase.length === 0) {
      return responseUtils.sendErrorResponse(res, "Purchase not found", 201);
    }
    const purchaseView = purchase.map((purchase) => purchase.getView());
    responseUtils.sendSuccessResponse(res, { Purchase: purchaseView });
  } catch (error) {
    appLogger.error("Error getting purchase by id", error);
    responseUtils.sendErrorResponse(res, "Error retrieving purchase");
  }
}

async function getPurchasesByDate(req, res) {
  const { date } = req.params;
  try {
    const purchases = await purchaseService.getPurchasesByDate(date);

    if (!purchases) {
      return responseUtils.sendErrorResponse(
        res,
        "No purchases for the specified date"
      );
    }

    const purchasesView = purchases.map((purchase) => purchase.getView());

    responseUtils.sendSuccessResponse(res, { Purchases: purchasesView });
  } catch (error) {
    appLogger.error("Error getting purchases by date", error);
    responseUtils.sendErrorResponse(res, "Error retrieving purchases");
  }
}

async function createPurchase(req, res) {
  try {
    const {
      providerId,
      provider_name,
      paymentMethod,
      doc_number,
      status,
      sub_total,
      taxes_amount,
      total,
      purchaseItems,
    } = req.body;
    const existingPurchase = await purchaseService.getPurchaseByDocNumber(
      doc_number
    );

    if (
      existingPurchase &&
      existingPurchase.find((purchase) => purchase.doc_number === doc_number)
    ) {
      return responseUtils.sendErrorResponse(
        res,
        "Document number already exists",
        400
      );
    }

    const validStatuses = ["aceptado", "anulado"];
    if (!validStatuses.includes(status)) {
      return responseUtils.sendErrorResponse(
        res,
        "Invalid status provided",
        400
      );
    }

    const purchaseData = {
      doc_number,
      providerId,
      provider_name,
      paymentMethod,
      status,
      taxes_amount,
      sub_total,
      total,
      purchaseItems,
    };

    const transaction = await sequelize.transaction();

    try {
      const { purchase, purchaseItems } = await purchaseService.createPurchase(
        purchaseData
      );
      // purchase.purchaseItems = purchaseItems;
      await transaction.commit();
      appLogger.info("Purchase created successfully");
      responseUtils.sendSuccessResponse(res, { purchase }, 201);
    } catch (error) {
      // await transaction.rollback();
      console.log(error);
      appLogger.error("Error creating purchase", error);
      responseUtils.sendErrorResponse(res, "Error creating purchase");
    }
  } catch (error) {
    appLogger.error("Error creating purchase", error);
    responseUtils.sendErrorResponse(res, "Error creating purchase");
  }
}

async function cancelPurchase(req, res) {
  const { doc_number } = req.params;
  try {
    const purchase = await purchaseService.cancelPurchase(doc_number);
    if (!purchase) {
      return responseUtils.sendErrorResponse(res, "Purchase not found", 404);
    }

    responseUtils.sendSuccessResponse(res, {
      message: "Purchase cancelled successfully",
    });
  } catch (error) {
    appLogger.error("Error cancelling purchase", error);
    responseUtils.sendErrorResponse(res, "Error cancelling purchase");
  }
}


async function deletePurchase(req, res) {
  try {
    const { doc_number } = req.params;
    const { password } = req.body;

    if (password !== process.env.DELETE_PASSWORD) {
      return responseUtils.sendErrorResponse(res, "Invalid password", 403);
    }
    const existingPurchase = await purchaseService.getPurchaseByDocNumber(
      doc_number
    );

    if (
      existingPurchase &&
      existingPurchase.find((purchase) => purchase.doc_number === doc_number)
    ) {
      const purchaseStatus = existingPurchase[0].status;
      if (purchaseStatus !== "anulada") {
        return responseUtils.sendErrorResponse(
          res,
          "Purchase status is not correct, must be cancelled first",
          400
        );
      }
      const transaction = await sequelize.transaction();

      try {
        await purchaseService.deletePurchase(doc_number);
        await transaction.commit();
        responseUtils.sendSuccessResponse(res, {
          message: `Document number ${doc_number} successfully deleted`,
        });
      } catch (error) {
        await transaction.rollback();
        appLogger.error("Error deleting purchase", error);
        responseUtils.sendErrorResponse(res, "Error deleting purchase");
      }
    } else {
      responseUtils.sendErrorResponse(
        res,
        "Document number does not exist",
        400
      );
    }
  } catch (error) {
    appLogger.error("Error deleting purchase", error);
    responseUtils.sendErrorResponse(res, "Error deleting purchase");
  }
}

module.exports = {
  getAllPurchases,
  getPurchaseByDocNumber,
  getPurchasesByDate,
  createPurchase,
  cancelPurchase,
  deletePurchase,
};
