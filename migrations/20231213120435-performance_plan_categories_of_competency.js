'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('performance_plan_categories_of_competency', {
      ppcoc_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ppcoc_ppm_id: {
        type: Sequelize.STRING,
        allowNull:true,
      },
      ppcoc_work_quality: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_work_quantity: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_job_knowledge: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_organization_work: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_teamwork: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_initiative: {
        type: Sequelize.TEXT,
        allowNull:true,
      },
      ppcoc_communication_skill: {
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
