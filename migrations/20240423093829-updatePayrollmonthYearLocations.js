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
      queryInterface.addColumn('payroll_month_year_locations', 'pmyl_authorised', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }),

      queryInterface.addColumn('payroll_month_year_locations', 'pmyl_authorised_by', {
        type: Sequelize.STRING,
        allowNull: true
      }),

      queryInterface.addColumn('payroll_month_year_locations', 'pmyl_authorised_date', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }),

      queryInterface.addColumn('payroll_month_year_locations', 'pmyl_authorised_comment', {
        type: Sequelize.STRING,
        allowNull: true
      }),

      queryInterface.addColumn('payroll_month_year_locations', 'pmyl_approved_comment', {
        type: Sequelize.STRING,
        allowNull: true
      }),

      queryInterface.addColumn('salary', 'salary_authorised', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }),

      queryInterface.addColumn('salary', 'salary_authorised_by', {
        type: Sequelize.STRING,
        allowNull: true
      }),

      queryInterface.addColumn('salary', 'salary_authorised_date', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }),

      queryInterface.addColumn('permissions', 'perm_authorise_payroll', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      })
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
