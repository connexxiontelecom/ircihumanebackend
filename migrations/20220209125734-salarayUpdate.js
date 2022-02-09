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
          'salary_amount',
          {
            type: Sequelize.DOUBLE,
            allowNull:true,
            defaultValue: 0
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_confirmed_by',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            defaultValue: 0
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_confirmed_date',
          {
            type: Sequelize.DATE,
            allowNull:true,

          }
      ),


      queryInterface.addColumn(
          'salary',
          'salary_approved',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            defaultValue: 0
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_approved_by',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            defaultValue: 0
          }
      ),

      queryInterface.addColumn(
          'salary',
          'salary_approved_date',
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
