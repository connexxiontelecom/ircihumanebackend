'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_app_documents', {
      leavedoc_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leavedoc_leave_id: {
        type: Sequelize.INTEGER
      },
      leavedoc_url: {
        type: Sequelize.STRING
      },
      leavedoc_filename: {
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
    await queryInterface.dropTable('leave_app_documents');
  }
};
