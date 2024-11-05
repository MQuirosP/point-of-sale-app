"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AuditDocument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AuditDocument.hasMany(models.AuditItem, {
        foreignKey: "doc_number",
        sourceKey: "doc_number",
        as: "auditItems",
      });
    }
  }
  AuditDocument.init(
    {
      doc_number: {
        type: DataTypes.STRING,
      unique: true},
      username: DataTypes.STRING, // Cambio de "date" a "username"
      auditId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "AuditDocument",
    }
  );

  // Hook para generar el número de documento antes de crear el registro
  AuditDocument.beforeCreate(async (auditDocument) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const day = currentDate.getDate().toString().padStart(2, "0");

    const lastAuditDocument = await AuditDocument.findOne({
      order: [["createdAt", "DESC"]],
    });

    let consecutive = 1;
    if (lastAuditDocument) {
      const lastConsecutive = parseInt(
        lastAuditDocument.doc_number.split("-")[1],
        10
      );
      consecutive = isNaN(lastConsecutive) ? 1 : lastConsecutive + 1;
    }

    const formattedConsecutive = consecutive.toString().padStart(4, "0");
    auditDocument.doc_number = `${year}${month}${day}-${formattedConsecutive}`;
    auditDocument.auditId = consecutive;
  });
  return AuditDocument;
};
