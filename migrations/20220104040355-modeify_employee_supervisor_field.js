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
          'emp_supervisor_status',
          {
            type: Sequelize.INTEGER,
            allowNull:true
          }
      ),
      queryInterface.addColumn(
          'employees',
          'emp_supervisor_id',
          {
            type: Sequelize.INTEGER,
            allowNull:true
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
