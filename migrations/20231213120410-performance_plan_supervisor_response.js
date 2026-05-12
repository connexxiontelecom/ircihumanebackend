'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('performance_plan_supervisor_response', {
      ppsr_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ppsr_ppm_id: {
        type: Sequelize.STRING
      },
      ppsr_critical_accomplishment: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
       ppsr_employee_strength: {
        type: Sequelize.TEXT,
        allowNull:true,
      },

       ppsr_growth_areas: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
       ppsr_action_plan: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
        ppsr_additional_supervisor_comment: {
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
