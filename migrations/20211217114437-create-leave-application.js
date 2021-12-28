'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_applications', {
      leapp_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leapp_empid: {
        type: Sequelize.INTEGER
      },
      leapp_leave_type: {
        type: Sequelize.INTEGER
      },
      leapp_start_date: {
        type: Sequelize.DATE
      },
      leapp_end_date: {
        type: Sequelize.DATE
      },
      leapp_total_days: {
        type: Sequelize.INTEGER
      },
      leapp_verify_by: {
        type: Sequelize.INTEGER
      },
      leapp_verify_date: {
        type: Sequelize.DATE
      },
      leapp_verify_comment: {
        type: Sequelize.STRING
      },
      leapp_recommend_by: {
        type: Sequelize.STRING
      },
      leapp_recommend_date: {
        type: Sequelize.DATE
      },
      leapp_recommend_comment: {
        type: Sequelize.STRING
      },
      leapp_approve_by: {
        type: Sequelize.STRING
      },
      leapp_approve_date: {
        type: Sequelize.DATE
      },
      leapp_approve_comment: {
        type: Sequelize.STRING
      },
      leapp_status: {
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
    await queryInterface.dropTable('leave_applications');
  }
};
