'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_cron', {
      sc_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sc_month: {
        type: Sequelize.INTEGER
      },
      sc_year: {
        type: Sequelize.INTEGER
      },
      sc_location_id: {
        type: Sequelize.INTEGER
      },
      sc_location_name: {
        type: Sequelize.STRING
      },
      sc_location_code: {
        type: Sequelize.STRING
      },
      sc_gross: {
        type: Sequelize.DOUBLE
      },
      sc_total_deduction: {
        type: Sequelize.DOUBLE
      },
      sc_net: {
        type: Sequelize.DOUBLE
      },
      sc_employee_count: {
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
    await queryInterface.dropTable('salary_cron');
  }
};
