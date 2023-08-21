"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Provider = sequelize.define(
    "Provider",
    {
      provider_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      provider_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      provider_address: {
        type: DataTypes.STRING(100),
      },
      provider_phone: {
        type: DataTypes.STRING(20),
      },
      provider_email: {
        type: DataTypes.STRING(50),
      },
      provider_dni: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      }
    },
    {
      modelName: "Provider",
      tableName: "Providers",
      timestamps: true, 
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Provider;
};
