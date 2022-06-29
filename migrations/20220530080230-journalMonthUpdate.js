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
          'journals',
          'j_month',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),

      queryInterface.addColumn(
          'journals',
          'j_year',
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
