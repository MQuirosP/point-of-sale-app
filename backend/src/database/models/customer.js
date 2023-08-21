'use strict';

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
    }
  }

  Customer.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      customer_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customer_first_lastname: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customer_second_lastname: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customer_address: {
        type: DataTypes.STRING(255),
      },
      customer_phone: {
        type: DataTypes.STRING(20),
      },
      customer_email: {
        type: DataTypes.STRING(255),
      },
      customer_dni: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "Customers",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Customer;
};
