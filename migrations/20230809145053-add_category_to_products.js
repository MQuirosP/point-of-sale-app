'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'category_id', {
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('Products', 'category', {
      type: Sequelize.STRING,
    });

    // Actualiza los registros existentes
    await queryInterface.sequelize.query(
      `UPDATE "Products" SET "category_id" = 1, "category" = 'Front-of-House'`
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
