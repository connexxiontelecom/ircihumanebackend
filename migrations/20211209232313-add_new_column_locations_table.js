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
          'locations',
          'l_state_id',
          {
            type: Sequelize.INTEGER,
            allowNull:true
          }
      ),
      queryInterface.addColumn(
          'locations',
          'l_t6_code',
          {
            type:Sequelize.STRING,
            allowNull:true
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
