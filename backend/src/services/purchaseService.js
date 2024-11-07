const { Purchase, PurchaseItems } = require("../database/models");
const { appLogger } = require("../utils/logger");
const { Op } = require("sequelize");
const sequelize = require("../database/sequelize");
const productService = require("../services/productService");
const moment = require("moment");

const getAllPurchases = async () => {
  try {
    const purchases = await Purchase.findAll({
      attributes: [
        "purchaseId",
        "doc_number",
        "provider_name",
        "paymentMethod",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
        "createdAt",
        "updatedAt",
      ],
      include: [
        { model: PurchaseItems, as: "purchaseItems" }
      ],
      order: [["purchaseId", "ASC"]],
    });
    return purchases;
  } catch (error) {
    console.error("Error getting purchases:", error);
    throw error;
  }
};

async function getPurchaseByDocNumber(doc_number) {
  try {
    const purchase = await Purchase.findOne({
      where: { doc_number },
      attributes: [
        "purchaseId",
        "doc_number",
        "provider_name",
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [
        { model: PurchaseItems, as: "purchaseItems" }
      ],
    });
    return purchase;
  } catch (error) {
    appLogger.error("Error fetching purchase by document number", error);
    throw error;
  }
}

async function getPurchasesByDate(date) {
  try {
    const purchases = await Purchase.findAll({
      where: {
        createdAt: {
          [Op.gte]: moment(date).startOf("day").toDate(),
          [Op.lte]: moment(date).endOf("day").toDate(),
        },
      },
      attributes: [
        "purchaseId",
        "doc_number",
        "provider_name",
        "paymentMethod",
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [{ model: PurchaseItems, as: "purchaseItems" }],
      order: [["purchaseId", "ASC"]],
    });

    return purchases;
  } catch (error) {
    appLogger.error("Error getting purchases by date", error);
    throw error;
  }
}

async function createPurchase(purchaseData) {
  return sequelize.transaction(async (t) => {
    const purchase = await Purchase.create(purchaseData, {
      include: [{ model: PurchaseItems, as: "purchaseItems" }],
      transaction: t,
    });
    return purchase;
  });
}

async function cancelPurchase(doc_number) {
  try {
    const purchase = await Purchase.findOne({
      where: { doc_number },
      include: [{ model: PurchaseItems, as: "purchaseItems" }],
    });

    if (!purchase) return null; // No se encuentra la compra

    if (purchase.status === "anulado") throw new Error("Purchase is already cancelled");

    purchase.status = "anulado";
    await purchase.save();

    for (const purchaseItem of purchase.purchaseItems) {
      const product = await productService.getProductByIntCode(
        purchaseItem.int_code
      );
      const newStock = Number(product.quantity) - Number(purchaseItem.quantity);
      await productService.updateProduct(product.productId, {
        quantity: newStock,
      });
      await this.cancelPurchaseItem(purchaseItem.int_code, purchase.purchaseId);
    }
    return purchase; // Retorna la compra con el estado actualizado
  } catch (error) {
    appLogger.error("Error cancelling purchase", error);
    throw error;
  }
}

async function cancelPurchaseItem(intCode, purchaseId) {
  try {
    const purchaseItem = await PurchaseItems.findOne({
      where: { int_code: intCode, purchaseId: purchaseId },
    });
    if (!purchaseItem) throw new Error("Purchase item not found");
    purchaseItem.quantity = Number(purchaseItem.quantity);
    purchaseItem.status = "anulado";
    purchaseItem.quantity = 0;
    await purchaseItem.save();

    return purchaseItem;
  } catch (error) {
    throw error;
  }
}

async function deletePurchase(doc_number) {
  try {
    await Purchase.destroy({
      where: { doc_number },
    });
  } catch (error) {
    appLogger.error("Error deleting purchase by document number", error);
    throw error;
  }
}

module.exports = {
  getAllPurchases,
  getPurchaseByDocNumber,
  getPurchasesByDate,
  createPurchase,
  cancelPurchase,
  cancelPurchaseItem,
  deletePurchase,
};
