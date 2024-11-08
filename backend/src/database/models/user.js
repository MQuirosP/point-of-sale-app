"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../../utils/dateUtils");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  User.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("administrator", "user"),
        allowNull: true,
        defaultValue: "user",
      },
      status: {
        type: DataTypes.ENUM("active", "suspended", "pending"),
        allowNull: true,
        defaultValue: "pending",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: true,
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
          const rawValue = this.getDataValue("updatedAt");
          return formatDate(rawValue);
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
    }
  );

  User.prototype.getView = function () {
    return {
      userId: this.userId,
      username: this.username,
      name: this.name,
      lastname: this.lastname,
      role: this.role,
      status: this.status,
      email: this.email,
      // createdAt: this.createdAt,
      // updatedAt: this.updatedAt,
    }
  }

  return User;
};
