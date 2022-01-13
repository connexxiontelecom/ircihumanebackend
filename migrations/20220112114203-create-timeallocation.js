'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('time_allocations', {
      ta_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ta_emp_id: {
        type: Sequelize.INTEGER
      },
      ta_month: {
        type: Sequelize.TEXT
      },
      ta_year: {
        type: Sequelize.TEXT
      },
      ta_tcode: {
        type: Sequelize.TEXT
      },
      ta_charge: {
        type: Sequelize.DOUBLE
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
    await queryInterface.dropTable('time_allocations');
  }
};
