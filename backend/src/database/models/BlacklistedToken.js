"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");
const { sequelize } = require('../sequelize');

module.exports = (sequelize, DataTypes) => {
  class BlacklistedToken extends Model {
    static associate(models) {
      // Definir asociaciones si es necesario
    }
  }

  BlacklistedToken.init(
    {
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BlacklistedToken",
      tableName: "BlacklistedTokens"
    }
  );

  BlacklistedToken.prototype.getView = function () {
    return {
      token: this.token,
      expiresAt: formatDate(this.expiresAt),
    };
  };

  return BlacklistedToken;
};