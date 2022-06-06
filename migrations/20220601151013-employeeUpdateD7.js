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
          'employees',
          'emp_d7',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'employees',
          'emp_d4',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'employees',
          'emp_d5',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'employees',
          'emp_d6',
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
