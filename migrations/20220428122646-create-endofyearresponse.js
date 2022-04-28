'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('end_year_responses', {
      eyr_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      eyr_goal:{
        allowNull: true,
        type: Sequelize.STRING
      },
      eyr_reflection: {
        allowNull: true,
        type: Sequelize.STRING
      },
      eyr_type: {
        type: Sequelize.INTEGER
      },

      eyr_emp_id: {
        type: Sequelize.INTEGER
      },
      eyr_gs_id: {
        type: Sequelize.INTEGER
      },
      eyr_strength:{
        allowNull: true,
        type: Sequelize.STRING
      },
      eyr_growth_area: {
        allowNull: true,
        type: Sequelize.STRING
      },
      eyr_response: {
        allowNull: true,
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
    await queryInterface.dropTable('endofyearresponses');
  }
};