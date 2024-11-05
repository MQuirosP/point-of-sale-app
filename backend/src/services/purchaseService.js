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
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [
        {
          model: PurchaseItems,
          as: "purchaseItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "purchase_price",
            "sub_total",
            "taxes_amount",
            "total",
          ],
        },
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
    const purchase = await Purchase.findAll({
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
        {
          model: PurchaseItems,
          as: "purchaseItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "purchase_price",
            "sub_total",
            "taxes_amount",
            "total",
          ],
        },
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
        "createdAt",
        "updatedAt",
        "status",
        "sub_total",
        "taxes_amount",
        "total",
      ],
      include: [
        {
          model: PurchaseItems,
          as: "purchaseItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "purchase_price",
            "sub_total",
            "taxes_amount",
            "total",
          ],
        },
      ],
      order: [["purchaseId", "ASC"]],
    });

    return purchases;
  } catch (error) {
    appLogger.error("Error getting purchases by date", error);
    throw error;
  }
}

async function createPurchase(purchaseData) {
  console.log(purchaseData);
  return sequelize.transaction(async (t) => {
    const purchase = await Purchase.create(purchaseData, {
      include: [{ model: PurchaseItems, as: "purchaseItems" }],
      transaction: t,
    });
    return purchase;
  });
}


async function cancelPurchaseItem(intCode, purchaseId) {
  try {
    const purchaseItem = await PurchaseItems.findOne({
      where: { int_code: intCode, purchaseId: purchaseId },
    });
    if (!purchaseItem) {
      throw new Error("Purchase item not found");
    }

    purchaseItem.status = "anulada";
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
  cancelPurchaseItem,
  deletePurchase,
};
