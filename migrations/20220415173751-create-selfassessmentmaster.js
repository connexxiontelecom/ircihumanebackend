'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('self_assessment_master', {
      sam_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sam_gs_id: {
        type: Sequelize.INTEGER
      },
      sam_emp_id: {
        type: Sequelize.INTEGER
      },
      sam_status: {
        type: Sequelize.INTEGER
      },

      sam_supervisor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
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
    await queryInterface.dropTable('self_assessment_master');
  }
};