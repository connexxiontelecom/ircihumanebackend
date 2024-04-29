'use strict';

const TABLE_NAME = 'travel_application_hotels';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable(TABLE_NAME, {
      ta_hotel_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ta_hotel_travelapp_id: {
        type: Sequelize.INTEGER
      },
      ta_hotel_name: {
        type: Sequelize.STRING
      },
      ta_hotel_city: {
        type: Sequelize.STRING
      },
      ta_hotel_country: {
        type: Sequelize.STRING
      },
      ta_hotel_arrival_date: {
        type: Sequelize.DATE
      },
      ta_hotel_departure_date: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable(TABLE_NAME);
  }
};
