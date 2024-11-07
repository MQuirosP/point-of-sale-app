require("dotenv").config();
const saleService = require("../services/saleService");
const { appLogger } = require("../utils/logger");
const responseUtils = require("../utils/responseUtils");
const sequelize = require("../database/sequelize");
const { Sale } = require("../database/models");

async function getAllSales(req, res) {
  try {
    const { date } = req.body;
    let sales;
    if (date) {
      sales = await saleService.getSalesByDate(date);
    } else {
      sales = await saleService.getAllSales();
    }
    if (!sales) {
      return responseUtils.sendErrorResponse(res, "No sales to show");
    } else {
      const salesView = sales.map((sales) => sales.getView());
      responseUtils.sendSuccessResponse(res, { Sales: salesView });
    }
  } catch (error) {
    appLogger.error("Error al obtener las ventas", error);
    responseUtils.sendErrorResponse(res, "Error al recuperar las ventas");
  }
}

async function getSaleByDocNumber(req, res) {
  const { doc_number } = req.params;
  try {
    const sale = await saleService.getSaleByDocNumber(doc_number);
    if (!sale || sale.length === 0) {
      return responseUtils.sendErrorResponse(
        res,
        `Sale with number ${doc_number} not found`,
        404
      );
    }
    responseUtils.sendSuccessResponse(res, { sale });
  } catch (error) {
    appLogger.error("Error getting sale by id", error);
    responseUtils.sendErrorResponse(res, "Error retrieving sale");
  }
}

async function getSalesByDate(req, res) {
  const { date } = req.params;
  try {
    const sales = await saleService.getSalesByDate(date);

    if (!sales) {
      return responseUtils.sendErrorResponse(
        res,
        "No sales for the specified date"
      );
    }

    const salesView = sales.map((sale) => sale.getView());

    responseUtils.sendSuccessResponse(res, { Sales: salesView });
  } catch (error) {
    appLogger.error("Error getting sales by date ", error);
    responseUtils.sendErrorResponse(res, "Error retrieving sales");
  }
}

async function createSale(req, res) {
  console.log(req.body);
  try {
    const {
      customerId,
      customer_name,
      paymentMethod,
      status,
      sub_total,
      taxes_amount,
      total,
      saleItems,
    } = req.body;

    const validStatuses = ["aceptado", "anulado"];
    if (!validStatuses.includes(status)) {
      return responseUtils.sendErrorResponse(
        res,
        "Invalid status provided",
        400
      );
    }

    const saleData = {
      customerId,
      customer_name,
      paymentMethod,
      status,
      taxes_amount,
      sub_total,
      total,
      saleItems,
    };

    const transaction = await sequelize.transaction();
    try {
      const { sale } = await saleService.createSale(saleData);
      await transaction.commit();
      appLogger.info("Sale created succesfully");
      responseUtils.sendSuccessResponse(res, { sale }, 201);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      appLogger.error("Error creating sale", error);
      responseUtils.sendErrorResponse(res, "Error creating sale");
    }
  } catch (error) {
    appLogger.error("Error creating sale", error);
    responseUtils.sendErrorResponse(res, "Error creating sale");
  }
}

async function cancelSale(req, res) {
  const { doc_number } = req.params;
  try {
    const sale = await saleService.cancelSale(doc_number);
    if (!sale) {
      return responseUtils.sendErrorResponse(res, "Sale not found", 404);
    }

    responseUtils.sendSuccessResponse(res, {
      message: "Sale cancelled successfully",
    });
  } catch (error) {
    appLogger.error("Error cancelling sale", error);
    responseUtils.sendErrorResponse(res, "Error cancelling sale");
  }
}

async function deleteSale(req, res) {
  try {
    const { doc_number } = req.params;
    const { password } = req.body;

    if (password !== process.env.DELETE_PASSWORD) {
      return responseUtils.sendErrorResponse(res, "Invalid password", 403);
    }
    const existingSale = await saleService.getSaleByDocNumber(doc_number);

    if (
      existingSale &&
      existingSale.find((sale) => sale.doc_number === doc_number)
    ) {
      const salestatus = existingSale[0].status;
      if (salestatus !== "anulada") {
        return responseUtils.sendErrorResponse(
          res,
          "sale status is not correct, must be cancelled first",
          400
        );
      }
      const transaction = await sequelize.transaction();

      try {
        await saleService.deleteSale(doc_number);
        await transaction.commit();
        responseUtils.sendSuccessResponse(res, {
          message: `Document number ${doc_number} successfully deleted`,
        });
      } catch (error) {
        await transaction.rollback();
        appLogger.error("Error deleting sale", error);
        responseUtils.sendErrorResponse(res, "Error deleting sale");
      }
    } else {
      responseUtils.sendErrorResponse(
        res,
        "Document number does not exist",
        400
      );
    }
  } catch (error) {
    appLogger.error("Error deleting sale", error);
    responseUtils.sendErrorResponse(res, "Error deleting sale");
  }
}

module.exports = {
  getAllSales,
  getSaleByDocNumber,
  getSalesByDate,
  createSale,
  cancelSale,
  deleteSale,
};
