const { Sale, SaleItems } = require("../database/models");
const { appLogger } = require("../utils/logger");
const { Op } = require("sequelize");
const sequelize = require("../database/sequelize");
const productService = require("../services/productService");
const moment = require("moment");

const getAllSales = async () => {
  try {
    const sales = await Sale.findAll({
      attributes: [
        "saleId",
        "doc_number",
        "customer_name",
        "paymentMethod",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
        "createdAt",
        "updatedAt",
      ],
      include: [{ model: SaleItems, as: "saleItems" }],
      order: [["saleId", "ASC"]],
    });
    return sales;
  } catch (error) {
    console.error("Error getting sales:", error);
    throw error;
  }
};

async function getSaleByDocNumber(doc_number) {
  try {
    const sale = await Sale.findAll({
      where: { doc_number: doc_number },
      attributes: [
        "saleId",
        "doc_number",
        "customer_name",
        "paymentMethod",
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [{ model: SaleItems, as: "saleItems" }],
    });
    return sale;
  } catch (error) {
    appLogger.error("Error fetching sale by document number", error);
    throw error;
  }
}

async function getSalesByDate(date) {
  try {
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: moment(date).startOf("day").toDate(),
          [Op.lte]: moment(date).endOf("day").toDate(),
        },
      },
      attributes: [
        "saleId",
        "doc_number",
        "customer_name",
        "paymentMethod",
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [{ model: SaleItems, as: "saleItems" }],
      order: [["saleId", "ASC"]],
    });
    return sales;
  } catch (error) {
    console.error("Error getting sales by date:", error);
    throw error;
  }
}

async function createSale(saleData) {
  return sequelize.transaction(async (t) => {
    const sale = await Sale.create(saleData, {
      include: [{ model: SaleItems, as: "saleItems" }],
      transaction: t,
    });
    return sale;
  });
}

async function cancelSale(doc_number) {
  try {
    const sale = await Sale.findOne({
      where: { doc_number },
      include: [{ model: SaleItems, as: "saleItems" }],
    });

    if (!sale) return null;

    if (sale.status === "anulado") throw new Error("Sale is already cancelled");

    sale.status = "anulado;"
    await sale.save();

    for (const saleItem of sale.saleItems) {
      const product = await productService.getProductByIntCode(
        saleItem.int_code
      );
      const newStock = Number(product.quantity) + Number(saleItem.quantity);
      await productService.updateProduct(product.productId, {
        quantity: newStock,
      });
      await this.cancelSaleItem(saleItem.int_code, saleItem.saleId);
    }
    return sale;
  } catch (error) {
    appLogger.error("Error cancelling sale", error);
    throw error;
  }
}

async function cancelSaleItem(intCode, saleId) {
  try {
    const saleItem = await SaleItems.findOne({
      where: { int_code: intCode, saleId: saleId },
    });
    if (!saleItem) throw new Error("Sale item not found");
    saleItem.quantity = Number(saleItem.quantity);
    saleItem.status = "anulado";
    saleItem.quantity = 0;
    await saleItem.save();

    return saleItem;
  } catch (error) {
    throw error;
  }
}

async function deleteSale(doc_number) {
  try {
    await Sale.destroy({
      where: { doc_number },
    });
  } catch (error) {
    appLogger.error("Error deleting sale by document number", error);
    throw error;
  }
}

module.exports = {
  getAllSales,
  getSaleByDocNumber,
  getSalesByDate,
  createSale,
  cancelSale,
  cancelSaleItem,
  deleteSale,
};
