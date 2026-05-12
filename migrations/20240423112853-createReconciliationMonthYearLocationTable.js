'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reconciliation_month_year_location', {
      rmyl_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rmyl_month: {
        type: Sequelize.INTEGER
      },
      rmyl_year: {
        type: Sequelize.INTEGER
      },
      rmyl_location_id: {
        type: Sequelize.INTEGER
      },
      rmyl_run_by: {
        type: Sequelize.INTEGER
      },
      rmyl_comment: {
        type: Sequelize.STRING
      },
      rmyl_date: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('reconciliation_month_year_locations');
  }
};
