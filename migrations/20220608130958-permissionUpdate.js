'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn(
          'permissions',
          'perm_journal_code_setup',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
          queryInterface.addColumn(
          'permissions',
          'perm_salary_mapping',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
          queryInterface.addColumn(
          'permissions',
          'perm_undo_salary_mapping',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
          queryInterface.addColumn(
          'permissions',
          'perm_payroll_journal',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
          queryInterface.addColumn(
          'permissions',
          'perm_application_tracking',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
          queryInterface.addColumn(
          'permissions',
          'perm_supervisor_reassignment',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),

    ]);
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
