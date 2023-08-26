"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AuditItem extends Model {
    static associate(models) {
      AuditItem.belongsTo(models.AuditDocument, { foreignKey: "doc_number" });
    }
  }

  AuditItem.init(
    {
      adjusted_quantity: DataTypes.DECIMAL,
      adjusted_amount: DataTypes.DECIMAL,
      int_code: DataTypes.STRING,
      name: DataTypes.STRING,
      purchase_price: DataTypes.DECIMAL,
      category_id: DataTypes.INTEGER,
      category_name: DataTypes.STRING,
      doc_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "AuditItem",
    }
  );

  return AuditItem;
};
