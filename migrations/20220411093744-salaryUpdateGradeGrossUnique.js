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
          'salary',
          'salary_grade',
          {
            type: Sequelize.TEXT,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_gross',
          {
            type: Sequelize.DOUBLE,
            allowNull:true,
            defaultValue: 0
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_emp_name',
          {
            type: Sequelize.TEXT,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_emp_unique_id',
          {
            type: Sequelize.TEXT,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_emp_start_date',
          {
            type: Sequelize.DATE,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_emp_end_date',
          {
            type: Sequelize.DATE,
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
