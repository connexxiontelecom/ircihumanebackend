'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_journals', {
      pj_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pj_code: {
        type: Sequelize.STRING
      },
      pj_journal_item:{
        type: Sequelize.STRING
      },
      pj_location:{
        type: Sequelize.STRING
      },
      pj_setup_by: {
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
    await queryInterface.dropTable('payrollJournals');
  }
};