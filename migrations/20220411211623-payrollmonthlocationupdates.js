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
            'payroll_month_year_locations',
            'pmyl_confirmed',
            {
                type: Sequelize.INTEGER,
                allowNull:true,
                defaultValue: 0

            }
        ),
      queryInterface.addColumn(
          'payroll_month_year_locations',
          'pmyl_confirmed_by',
          {
            type: Sequelize.TEXT,
            allowNull:true,

          }
      ),

      queryInterface.addColumn(
          'payroll_month_year_locations',
          'pmyl_confirmed_date',
          {
            type: Sequelize.DATE,
            allowNull:true,

          }
      ),

        queryInterface.addColumn(
            'payroll_month_year_locations',
            'pmyl_approved',
            {
                type: Sequelize.INTEGER,
                allowNull:true,
                defaultValue: 0

            }
        ),
      queryInterface.addColumn(
          'payroll_month_year_locations',
          'pmyl_approved_by',
          {
            type: Sequelize.TEXT,
            allowNull:true,

          }
      ),

      queryInterface.addColumn(
          'payroll_month_year_locations',
          'pmyl_approved_date',
          {
            type: Sequelize.DATE,
            allowNull:true,

          }
      )
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
