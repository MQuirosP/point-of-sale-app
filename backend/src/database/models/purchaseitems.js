"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");

module.exports = (sequelize, DataTypes) => {
  class PurchaseItems extends Model {
    static associate = (models) => {
      PurchaseItems.belongsTo(models.Purchase, {
        foreignKey: "purchaseId",
        as: "purchase", 
      });
      PurchaseItems.belongsTo(models.Product, {
        foreignKey: "productId", 
        as: "product", 
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "aceptado",
        allowNull: false,
        validate: {
          isIn: [["aceptado", "anulado"]],
        },
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
    },
    {
      sequelize,
      modelName: "PurchaseItems",
      tableName: "PurchaseItems",
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
    if (product) {
      
      product.quantity = Number(product.quantity);
      const quantityToAdd = Number(purchaseItem.quantity);
      product.quantity += quantityToAdd;
      await product.save({ transaction: options.transaction });
    }
  });

  return PurchaseItems;
};
