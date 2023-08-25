'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      adjusted_quantity: {
        type: Sequelize.DECIMAL
      },
      adjusted_amount: {
        type: Sequelize.DECIMAL
      },
      int_code: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      purchase_price: {
        type: Sequelize.DECIMAL
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      category_name: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    // await queryInterface.dropTable('AuditItems');
  }
};