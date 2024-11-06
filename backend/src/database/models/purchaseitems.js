"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");
const Product = require("./product");

module.exports = (sequelize, DataTypes) => {
  class PurchaseItems extends Model {
    static associate = (models) => {
      PurchaseItems.belongsTo(models.Purchase, {
        foreignKey: "purchaseId",
        as: "purchase", // Alias para la relación
      });

      PurchaseItems.belongsTo(models.Product, {
        foreignKey: "productId", // Debe referirse a productId en lugar de int_code
        as: "product", // Alias para la relación
      });
    };
  }
  PurchaseItems.init(
    {
      sequence: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: DataTypes.INTEGER,
      purchaseId: DataTypes.INTEGER,
      int_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      purchase_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sub_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      taxes_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt",
        get() {
          const rawValue = this.getDataValue("createdAt");
          return formatDate(rawValue);
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
        get() {
          const rawValue = this.getDataValue("createdAt");
          return formatDate(rawValue);
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total: { type: DataTypes.DECIMAL(10, 2) },
      status: {
        type: DataTypes.STRING,
        defaultValue: "aceptado",
        allowNull: false,
        validate: {
          isIn: [["aceptado", "anulado"]],
        },
      },
    },
    {
      sequelize,
      modelName: "PurchaseItems",
    }
  );
  PurchaseItems.prototype.getView = function () {
    return {
      int_code: this.int_code,
      name: this.name,
      quantity: this.quantity,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      purchase_price: this.purchase_price,
      total: this.total,
    };
  };

  PurchaseItems.afterCreate(async (purchaseItem, options) => {
    const product = await sequelize.models.Product.findByPk(
      purchaseItem.productId
    );
    product.quantity = Number(product.quantity);
    if (product) {
      // Asegúrate de convertir a número
      const quantityToAdd = Number(purchaseItem.quantity);
      product.quantity += quantityToAdd;
      await product.save();
    }
  });

  PurchaseItems.afterUpdate(async (purchaseItem, options) => {
    const original = await PurchaseItems.findOne({
      where: { id: purchaseItem.id },
      transaction: options.transaction,
    });
    const product = await sequelize.models.Product.findByPk(
      purchaseItem.productId
    );
    if (product) {
      // Asegúrate de convertir a número
      const originalQuantity = Number(original.quantity);
      const newQuantity = Number(purchaseItem.quantity);

      // Ajustar stock según la diferencia
      product.quantity += newQuantity - originalQuantity;
      await product.save();
    }
  });

  return PurchaseItems;
};
