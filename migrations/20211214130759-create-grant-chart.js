'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('grant_charts', {
      gc_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
       gc_location_id: {
        type: Sequelize.INTEGER
      },
      gc_department_id: {
        type: Sequelize.INTEGER
      },
      gc_expense: {
        type: Sequelize.STRING
      },
      gc_account_code: {
        type: Sequelize.STRING
      },
      gc_description: {
        type: Sequelize.STRING
      },
      gc_amount: {
        type: Sequelize.DECIMAL
      },
      gc_donor_id: {
        type: Sequelize.INTEGER
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('grant_charts');
  }
};
