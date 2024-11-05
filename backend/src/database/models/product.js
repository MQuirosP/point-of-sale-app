'use strict';
const { Model } = require('sequelize');
const { formatDate } = require('../../utils/dateUtils');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate = (models) => {
      Product.belongsToMany(models.Purchase, {
          through: models.PurchaseItems, // Nombre de la tabla intermedia
          foreignKey: 'productId', // Clave foránea en PurchaseItems
          otherKey: 'purchaseId', // Clave foránea en Purchase
          as: 'purchases', // Alias para la relación
      });
  
      // Aquí puedes definir la relación con PurchaseItems
      Product.hasMany(models.PurchaseItems, {
          foreignKey: 'productId', // Clave foránea en PurchaseItems
          as: 'purchaseItems', // Alias para la relación
      });
  };
  }

  Product.init(
    {
      productId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      int_code: {
        type: DataTypes.STRING,
        unique: true,
      },
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      purchase_price: DataTypes.DECIMAL(10, 2),
      quantity: DataTypes.DECIMAL(10, 2),
      sale_price: DataTypes.DECIMAL(10, 2),
      taxes: DataTypes.BOOLEAN,
      margin: DataTypes.DECIMAL(10, 2),
      taxPercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        validate: {
          isIn: [[0, 1]],
        },
      },
      category_name: {
        type: DataTypes.STRING,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt',
        get() {
          const rawValue = this.getDataValue('createdAt');
          return formatDate(rawValue);
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt',
        get() {
          const rawValue = this.getDataValue('updatedAt');
          return formatDate(rawValue);
        },
      },
    },
    {
      sequelize,
      modelName: 'Product',
      hooks: true,
    }
  );

  Product.beforeCreate((product, options) => {
    const categoryId = product.getDataValue('category_id');
    console.log(categoryId);
    product.setDataValue('category_name', categoryId === 1 ? 'Venta Directa' : 'Consumo Interno');
  });
  
  Product.beforeUpdate((product, options) => {;
    const categoryId = product.getDataValue('category_id');
    console.log(categoryId);
    product.setDataValue('category_name', categoryId === 1 ? 'Venta Directa' : 'Consumo Interno');
  });
  

  Product.prototype.getView = function () {
    return {
      productId: this.productId,
      int_code: this.int_code,
      name: this.name,
      description: this.description,
      quantity: this.quantity,
      purchase_price: this.purchase_price,
      taxes: this.taxes,
      taxPercentage: this.taxPercentage,
      margin: this.margin,
      sale_price: this.sale_price,
      category_id: this.category_id,
      category_name: this.category_name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  };

  return Product;
};