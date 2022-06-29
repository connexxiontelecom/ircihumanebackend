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
        'ratings',
        'rating_time_period',
        {
          type: Sequelize.INTEGER,
          allowNull:true,
        }
      ),
      queryInterface.addColumn(
        'ratings',
        'rating_status',
        {
          type: Sequelize.INTEGER,
          allowNull:true,
          defaultValue:1,
          comment:"0=inactive;1=active"
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
