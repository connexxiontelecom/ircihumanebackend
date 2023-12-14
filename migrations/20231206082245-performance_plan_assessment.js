'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('performance_plan_assessment', {
      ppa_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ppa_ppm_id: {
        type: Sequelize.INTEGER
      },
      ppa_goal: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppa_performance_measure: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ppa_performance_review:{
        type:Sequelize.TEXT,
        allowNull: true,
      },
      ppa_review_date: {
        type: Sequelize.DATE,
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
