'use strict';

const TABLE_NAME = 'travel_applications';

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
        TABLE_NAME,
        'travelapp_d3_id',
        {
          type: Sequelize.STRING,
        }
      ),
      queryInterface.addColumn(
        TABLE_NAME,
        'travelapp_d4_id',
        {
          type: Sequelize.STRING,
        }
      ),
      queryInterface.addColumn(
        TABLE_NAME,
        'travelapp_d5_id',
        {
          type: Sequelize.STRING,
        }
      ),
      queryInterface.addColumn(
        TABLE_NAME,
        'travelapp_trip_type',
        {
          type: Sequelize.STRING,
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
