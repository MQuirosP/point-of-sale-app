const fs = require("fs");
const csv = require("csv-parser");
const { Product } = require('../database/models/index');
const { dbLogger } = require("../utils/logger");

function loadProductsFromCSV(csvFilePath) {
  fs.createReadStream(csvFilePath, "utf8")
    .pipe(csv())
    .on("data", async (row) => {
      try {
        const {
          name,
          purchase_price,
          description,
          quantity,
          int_code,
          sale_price,
          taxes,
          margin,
          taxPercentage
        } = row;

        const newProduct = await Product.create({
          name,
          purchase_price: parseFloat(purchase_price),
          description,
          quantity: parseFloat(quantity),
          int_code,
          sale_price: parseFloat(sale_price),
          taxes,
          margin: parseFloat(margin),
          taxPercentage: parseFloat(taxPercentage),
        });

        dbLogger.info(`Product: ${newProduct.name} successfully created`);
      } catch (error) {
        dbLogger.error("Error creating product:", error);
      }
    })
    .on("end", () => {
      dbLogger.info("Data loaded successfully");
    });
}

module.exports = {
  loadProductsFromCSV,
};
