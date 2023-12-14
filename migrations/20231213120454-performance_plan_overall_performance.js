'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('performance_plan_overall_performance', {
      ppop_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ppop_ppm_id: {
        type: Sequelize.STRING,
        allowNull:true,
      },
      ppop_rate_employee: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppop_supervisor_recommendation: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
