'use strict';
const { Model } = require('sequelize');
const { formatDate } = require('../../utils/dateUtils');

module.exports = (sequelize, DataTypes) => {
  class SaleItems extends Model {
    static associate(models) {
      SaleItems.belongsTo(models.Sale, {
        foreignKey: 'saleId',
        as: 'sale',
      });
      SaleItems.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
      });
    }
  }
  SaleItems.init(
    {
        status: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [["aceptado", "anulada"]],
        },
      },
      saleId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true},
      int_code: {type: DataTypes.STRING},
      sale_price: DataTypes.DECIMAL,
      quantity: DataTypes.FLOAT,
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
      sub_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      taxes_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      total: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: 'SaleItems',
      tableName: "SaleItems",
    }
  );
  SaleItems.prototype.getView = function() {
    return {
      productId: this.productId,
      int_code: this.int_code,
      name: this.name,
      quantity: this.quantity,
      sale_price: this.sale_price,
      sub_total: this.sub_total,
      taxes_amount: this.taxes_amount,
      total: this.total,
    }
  }

  SaleItems.afterCreate(async (saleItem, options) => {
    const product = await sequelize.models.Product.findByPk(saleItem.productId);
    if (product) {
      product.quantity -= saleItem.quantity;
      await product.save();
    }
  });

  SaleItems.afterUpdate(async (saleItem, options) => {
    // Aquí puedes manejar la lógica para actualizar el stock si cambió la cantidad
    const original = await SaleItem.findOne({ where: { id: saleItem.id }, transaction: options.transaction });
    const product = await sequelize.models.Product.findByPk(saleItem.productId);
    if (product) {
      // Ajustar stock según la diferencia
      product.quantity += original.quantity - saleItem.quantity;
      await product.save();
    }
  });

  return SaleItems;
};