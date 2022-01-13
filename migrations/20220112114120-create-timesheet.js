'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('time_sheets', {
      ts_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ts_emp_id: {
        type: Sequelize.INTEGER
      },
      ts_month: {
        type: Sequelize.TEXT
      },
      ts_year: {
        type: Sequelize.TEXT
      },

      ts_day: {
        type: Sequelize.TEXT
      },

      ts_start: {
        type: Sequelize.TEXT
      },
      ts_end: {
        type: Sequelize.TEXT
      },
      ts_duration: {
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
    await queryInterface.dropTable('time_sheets');
  }
};
