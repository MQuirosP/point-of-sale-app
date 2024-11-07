"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");

module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    static associate(models) {
      Purchase.belongsToMany(models.Product, {
        through: models.PurchaseItems,
        foreignKey: "purchaseId",
        otherKey: "productId",
        as: "products",
      });
      Purchase.hasMany(models.PurchaseItems, {
        foreignKey: "purchaseId",
        as: "purchaseItems",
      });
      Purchase.belongsTo(models.Provider, {
        foreignKey: "providerId",
        as: "provider",
      });
    }
  }

  Purchase.init(
    {
      purchaseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      provider_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["contado", "credito"]],
        },
      },
      doc_number: {
        type: DataTypes.STRING,
        autoIncrement: false,
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
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "aceptado",
        validate: {
          isIn: [["aceptado", "anulado"]],
        },
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total: {
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
    },
    {
      sequelize,
      modelName: "Purchase",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );
  Purchase.prototype.getView = function () {
    return {
      purchaseId: this.purchaseId,
      doc_number: this.doc_number,
      status: this.status,
      provider_name: this.provider_name,
      createdAt: this.createdAt,
      updatedAt: this.createdAt,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      total: this.total,
      purchaseItems: this.purchaseItems.map((item) => item.getView()),
    };
  };

  return Purchase;
};
