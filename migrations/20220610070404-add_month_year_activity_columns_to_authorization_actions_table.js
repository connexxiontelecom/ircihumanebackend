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
        'authorization_actions',
        'auth_ts_month',
        {
          type: Sequelize.STRING,
          allowNull:true,
        }
      ),
      queryInterface.addColumn(
        'authorization_actions',
        'auth_ts_year',
        {
          type: Sequelize.STRING,
          allowNull:true,
        }
      ),
      queryInterface.addColumn(
        'authorization_actions',
        'auth_ts_activity',
        {
          type: Sequelize.STRING,
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
