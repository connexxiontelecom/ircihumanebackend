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
          'travel_applications',
          'travelapp_per_diem',
          {
            type: Sequelize.DOUBLE,
            allowNull:true,
            defaultValue:0,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_days',
          {
            type: Sequelize.STRING,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_currency',
          {
            type: Sequelize.STRING,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_total',
          {
            type: Sequelize.DOUBLE,
            allowNull:true,
            defaultValue:0
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_hotel',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            comment:"1=yes,0=no",
            defaultValue:0
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_city',
          {
            type: Sequelize.STRING,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_arrival_date',
          {
            type: Sequelize.DATE,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_departure_date',
          {
            type: Sequelize.DATE,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'travel_applications',
          'travelapp_preferred_hotel',
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
