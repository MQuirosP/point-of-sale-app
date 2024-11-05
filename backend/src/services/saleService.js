const { Sale, SaleItems } = require("../database/models");
const { appLogger } = require("../utils/logger");
const { Op } = require("sequelize");
const sequelize = require("../database/sequelize");
const productService = require("../services/productService");
const moment = require('moment')

const getAllSales = async () => {
  try {
    const sales = await Sale.findAll({
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
      include: [
        {
          model: SaleItems,
          as: "saleItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "sale_price",
            "sub_total",
            "taxes_amount",
            "total",
          ],
        },
      ],
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
      include: [
        {
          model: SaleItems,
          as: "saleItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "sale_price",
            "sub_total",
            "taxes_amount",
            "total",
          ],
        },
      ],
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
          [Op.gte]: moment(date).startOf('day').toDate(),
          [Op.lte]: moment(date).endOf('day').toDate(),
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
      include: [
        {
          model: SaleItems,
          as: "saleItems",
          attributes: [
            "int_code",
            "name",
            "quantity",
            "sale_price",
            "sub_total",
            "taxes_amount",
            "total"
          ],
        },
      ],
      order: [["saleId", "ASC"]],
    });
    return sales;
  } catch (error) {
    console.error("Error getting sales by date:", error);
    throw error;
  }
}

async function createSale(saleData) {
  const transaction = await sequelize.transaction();

  try {
    const {
      status,
      paymentMethod,
      customerId,
      customer_name,
      products,
      taxes_amount,
      sub_total,
    } = saleData;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Invalid or empty "products" array');
    }

    const sale = await Sale.create(
      {
        status,
        paymentMethod,
        customerId,
        customer_name,
        taxes_amount,
        sub_total,
      },
      { transaction }
    );

    let saleTotal = 0;
    const saleItems = [];

    for (const productData of products) {
      const { int_code, quantity, sub_total, taxes_amount } = productData;

      if (!int_code) {
        throw new Error("int_code is missing or undefined");
      }

      const product = await productService.getProductByIntCode(int_code);
      if (product) {
        const newStock = product.quantity - quantity;
        await productService.updateProduct(product.productId, {
          quantity: newStock,
        });

        const saleItemTotal = product.sale_price * quantity;
        saleTotal += saleItemTotal;

        const saleItem = await SaleItems.create(
          {
            saleId: sale.saleId,
            int_code: product.int_code,
            sale_price: product.sale_price,
            quantity,
            name: product.name,
            sub_total: sub_total,
            taxes_amount: taxes_amount,
            total: saleItemTotal,
            status: "aceptado",
          },
          { transaction }
        );

        saleItems.push(saleItem);
      } else {
        await transaction.rollback();
        throw new Error(`Product with int_code ${int_code} not found`);
      }
    }

    sale.total = saleTotal;
    await sale.save({ transaction });

    await transaction.commit();

    appLogger.info("Sale created successfully");
    return {
      sale,
      saleItems,
    };
  } catch (error) {
    await transaction.rollback();
    appLogger.error("Error creating sale", error);
    throw error;
  }
}

async function cancelSaleItem(intCode, saleId) {
  try {
    const saleItem = await SaleItems.findOne({
      where: { int_code: intCode, saleId: saleId },
    });
    if (!saleItem) {
      throw new Error("Sale item not found");
    }

    saleItem.status = "anulada";
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
  cancelSaleItem,
  deleteSale,
};
