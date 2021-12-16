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
          'emp_sex',
          {
            type: Sequelize.STRING,
            allowNull:true
          }
      ),
      queryInterface.addColumn(
          'employees',
          'emp_avatar',
          {
            type: Sequelize.STRING,
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
