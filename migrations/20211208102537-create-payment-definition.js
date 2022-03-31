'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_definitions', {
      pd_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pd_payment_code: {
        type: Sequelize.STRING
      },
      pd_payment_name: {
        type: Sequelize.STRING
      },
      pd_payment_type: {
        type: Sequelize.INTEGER
      },
      pd_payment_variant: {
        type: Sequelize.INTEGER
      },
      pd_payment_taxable: {
        type: Sequelize.INTEGER
      },
      pd_desc: {
        type: Sequelize.INTEGER
      },
      pd_basic: {
        type: Sequelize.STRING
      },
      pd_tie_number: {
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
    await queryInterface.dropTable('payment_definitions');
  }
};
