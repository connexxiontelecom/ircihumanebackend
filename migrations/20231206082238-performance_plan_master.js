'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('performance_plan_master', {
      ppm_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ppm_emp_id: {
        type: Sequelize.STRING
      },
      ppm_status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '0=Pending,1=Approved,2=Declined',
      },
      ppm_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ppm_end_date:{
        type:Sequelize.DATE,
        allowNull: true,
      },
      ppm_type: {
        type: Sequelize.INTEGER,
        defaultValue:1,
        comment:'1=Development, 2=Improvement',
      },
      ppm_supervisor_id: {
        type: Sequelize.INTEGER,
        allowNull:true,
      },
      ppm_supervisor_comment: {
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
