"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");

module.exports = (sequelize, DataTypes) => {
  class SaleItems extends Model {
    static associate(models) {
      SaleItems.belongsTo(models.Sale, {
        foreignKey: "saleId",
        as: "sale",
      });
      SaleItems.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }
  SaleItems.init(
    {
      sequence: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: DataTypes.INTEGER,
      saleId: DataTypes.INTEGER,
      int_code: { 
        type: DataTypes.STRING,
        allowNull: false,
      },
      sale_price: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
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
        allowNull: false
      },
      total: {
        type:DataTypes.DECIMAL,
        allowNull: false
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
      modelName: "SaleItems",
      tableName: "SaleItems",
    }
  );
  SaleItems.prototype.getView = function () {
    return {
      productId: this.productId,
      int_code: this.int_code,
      name: this.name,
      quantity: this.quantity,
      sale_price: this.sale_price,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      total: this.total,
    };
  };

  SaleItems.afterCreate(async (saleItem, options) => {
    const product = await sequelize.models.Product.findByPk(
      saleItem.productId
    );
    if (product) {
      // Asegúrate de convertir a número y restar del inventario
      product.quantity = Number(product.quantity)
      const quantityToSubtract = Number(saleItem.quantity);
      product.quantity -= quantityToSubtract;
      await product.save({ transaction: options.transaction });
    }
  });

  return SaleItems;
};
