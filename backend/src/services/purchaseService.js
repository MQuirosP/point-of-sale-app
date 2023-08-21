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
  const transaction = await sequelize.transaction();

  try {
    const {
      providerId,
      provider_name,
      paymentMethod,
      doc_number,
      status,
      sub_total,
      taxes_amount,
      purchaseItems,
    } = purchaseData;

    console.log(purchaseItems);

    if (!Array.isArray(purchaseItems) || purchaseItems.length === 0) {
      throw new Error("Invalid or empty 'products' array");
    }

    const purchase = await Purchase.create(
      {
        providerId,
        provider_name,
        paymentMethod,
        doc_number,
        status,
        sub_total,
        taxes_amount,
      },
      { transaction }
    );

    let purchaseTotal = 0;
    const productList = [];

    for (const item of purchaseItems) {
      console.log("OJO AQUI", item.productId);
      const { productId, quantity, taxes_amount, sub_total } = item;
      if (!productId) {
        throw new Error("int_code is missing or undefined");
      }

      const product = await productService.getProductoByPk(productId);

      if (product) {
        const newStock = product.quantity + quantity;
        await productService.updateProduct(productId, {
          quantity: newStock,
        });

        const purchaseItemTotal = product.purchase_price * quantity + taxes_amount;
        purchaseTotal += purchaseItemTotal;

        const purchaseItem = await PurchaseItems.create(
          {
            purchaseId: purchase.purchaseId,
            int_code: product.int_code,
            purchase_price: product.purchase_price,
            quantity,
            name: product.name,
            taxes_amount: taxes_amount,
            sub_total: sub_total,
            total: purchaseItemTotal,
            status: "aceptado",
          },
          { transaction }
        );

        productList.push(purchaseItem);
      } else {
        await transaction.rollback();
        throw new Error(`Product with int_code '${int_code}' not found`);
      }
    }

    purchase.total = purchaseTotal;
    await purchase.save({ transaction });

    await transaction.commit();

    appLogger.info("Purchase created successfully");
    return {
      purchase,
      purchaseItems,
    };
  } catch (error) {
    await transaction.rollback();
    appLogger.error("Error creating purchase", error);
    throw error;
  }
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
