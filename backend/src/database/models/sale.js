"use strict";
const { Op, Model } = require("sequelize");
const { appLogger } = require("../../utils/logger");
const { formatDate } = require("../../utils/dateUtils");

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      Sale.belongsToMany(models.Product, {
        through: models.SaleItems,
        foreignKey: "saleId",
        otherKey: "productId",
        as: "products",
      });
      Sale.hasMany(models.SaleItems, {
        foreignKey: "saleId",
        as: "saleItems",
      });
    }
  }

  Sale.init(
    {
      saleId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customer_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [["contado", "crédito", "sinpe", "tarjeta", "transferencia"]],
            msg: "El método de pago debe ser contado, crédito, sinpe, tarjeta o transferencia",
          },
        },
      },
      
      doc_number: {
        type: DataTypes.STRING,
        autoIncrement: false,
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
      sub_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      taxes_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Sale",
    }
  );

  Sale.beforeValidate(async (sale) => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString().padStart(4, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const day = currentDate.getDate().toString().padStart(2, "0");

      const lastSale = await Sale.findOne({
        where: {
          doc_number: {
            [Op.like]: `${year}${month}${day}-%`,
          },
        },
        order: [["createdAt", "DESC"]],
      });
      // console.log(lastSale);

      // const maxDocNumber = await Sale.max("doc_number", {
      //   where: { doc_number: { $like: `${year}${month}${day}-%` } },
      // });

      let consecutive = 1;
      if (lastSale) {
        consecutive =
          parseInt(lastSale.dataValues.doc_number.split("-")[1], 10) + 1;
      }

      sale.doc_number = `${year}${month}${day}-${consecutive
        .toString()
        .padStart(6, "0")}`;
        console.log("Assigned doc_number:", sale.doc_number);
    } catch (error) {
      // Manejar el error si ocurre alguna excepción
      appLogger.error("Error generating doc_number:", error);
    }
  });

  Sale.prototype.getView = function () {
    return {
      saleId: this.saleId,
      doc_number: this.doc_number,
      status: this.status,
      customer_name: this.customer_name,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      total: this.total,
      saleItems: this.saleItems.map((saleItem) => saleItem.getView()),
    };
  };

  return Sale;
};
