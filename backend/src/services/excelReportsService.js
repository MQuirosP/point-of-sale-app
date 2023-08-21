const {
  Sale,
  SaleItems,
  Purchase,
  PurchaseItems,
} = require("../database/models");
const { Op } = require("sequelize");

async function generateSalesReport(startDate, endDate) {
  const sales = await Sale.findAll({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: SaleItems,
        as: "saleItems",
      },
    ],
  });

  return sales;
}

async function generatePurchasesReport(startDate, endDate) {
  const purchases = await Purchase.findAll({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: PurchaseItems,
        as: "purchaseItems",
      },
    ],
  });
  return purchases;
}

module.exports = {
  generateSalesReport,
  generatePurchasesReport,
};
