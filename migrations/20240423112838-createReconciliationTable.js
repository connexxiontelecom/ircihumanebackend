'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reconciliations', {
      r_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      r_employee_id: {
        type: Sequelize.INTEGER
      },
      r_employee_t7: {
        type: Sequelize.STRING
      },
      r_employee_d7: {
        type: Sequelize.STRING
      },
      r_employee_name: {
        type: Sequelize.STRING
      },

      r_month: {
        type: Sequelize.STRING
      },
      r_year: {
        type: Sequelize.STRING
      },
      r_location_id: {
        type: Sequelize.STRING
      },
      r_gross: {
        type: Sequelize.DOUBLE
      },
      r_net: {
        type: Sequelize.DOUBLE
      },
      r_previous_gross: {
        type: Sequelize.DOUBLE
      },
      r_previous_net: {
        type: Sequelize.DOUBLE
      },
      r_variance_gross: {
        type: Sequelize.DOUBLE
      },
      r_variance_net: {
        type: Sequelize.DOUBLE
      },
      r_comment: {
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reconciliations');
  }
};
