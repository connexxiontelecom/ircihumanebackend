'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permissions', {
      perm_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      perm_user_id: {
        type: Sequelize.INTEGER
      },
      perm_manage_user:{
        type: Sequelize.INTEGER
      },
      perm_hr_config:{
        type: Sequelize.INTEGER
      },
      perm_payroll_config: {
        type: Sequelize.INTEGER
      } ,
      perm_payment_definition:{
        type: Sequelize.INTEGER
      },
      perm_onboard_employee: {
        type: Sequelize.INTEGER
      },
      perm_manage_employee:{
        type: Sequelize.INTEGER
      },
      perm_assign_supervisors: {
        type: Sequelize.INTEGER
      },
      perm_announcement:{
        type: Sequelize.INTEGER
      },
      perm_query: {
        type: Sequelize.INTEGER
      },
      perm_leave: {
        type: Sequelize.INTEGER
      },
      perm_travel: {
        type: Sequelize.INTEGER
      },
      perm_timesheet: {
        type: Sequelize.INTEGER
      },
      perm_self_assessment: {
        type: Sequelize.INTEGER
      },
      perm_leave_management: {
        type: Sequelize.INTEGER
      },
      perm_setup_variations: {
        type: Sequelize.INTEGER
      },
      perm_confirm_variations: {
        type: Sequelize.INTEGER
      },
      perm_approve_variations: {
        type: Sequelize.INTEGER
      },
      perm_decline_variations: {
        type: Sequelize.INTEGER
      },
      perm_run_payroll: {
        type: Sequelize.INTEGER
      },
      perm_undo_payroll: {
        type: Sequelize.INTEGER
      },
      perm_confirm_payroll: {
        type: Sequelize.INTEGER
      },
      perm_approve_payroll: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('permissions');
  }
};