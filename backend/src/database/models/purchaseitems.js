"use strict";
const { Model } = require("sequelize");
const { formatDate } = require('../../utils/dateUtils');
const Product = require('./product')

module.exports = (sequelize, DataTypes) => {
  class PurchaseItems extends Model {
    static associate(models) {
      PurchaseItems.belongsTo(models.Purchase, {
        foreignKey: "purchaseId",
        as: "purchase",
      });
      PurchaseItems.belongsTo(models.Product, {
        foreignKey: "int_code",
        as: "product",
      });
    }
  }
  PurchaseItems.init(
    {
      sequence: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      purchaseId: DataTypes.INTEGER,
      int_code: DataTypes.STRING,
      purchase_price: DataTypes.DECIMAL,
      quantity: DataTypes.FLOAT,
      sub_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      taxes_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      createdAt:{
        type: DataTypes.DATE,
        field: 'createdAt',
        get() {
          const rawValue = this.getDataValue('createdAt');
          return formatDate(rawValue);
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt',
        get() {
          const rawValue = this.getDataValue('createdAt');
          return formatDate(rawValue);
        }
      },
      name: DataTypes.STRING,
      total: DataTypes.DECIMAL,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "PurchaseItems",
    }
  );
  PurchaseItems.prototype.getView = function() {
    return {
      int_code: this.int_code,
      name: this.name,
      quantity: this.quantity,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      purchase_price: this.purchase_price,
      total: this.total,
    }
  }

  return PurchaseItems;
};
