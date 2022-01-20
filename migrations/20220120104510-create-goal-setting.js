'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('goal_settings', {
      gs_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      gs_from: {
        type: Sequelize.STRING
      },
      gs_to: {
        type: Sequelize.STRING
      },
      gs_year: {
        type: Sequelize.STRING
      },
      gs_status: {
        type: Sequelize.INTEGER
      },
      gs_activity: {
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
    await queryInterface.dropTable('goal_settings');
  }
};
