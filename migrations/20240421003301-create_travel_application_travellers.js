'use strict';

const TABLE_NAME = 'travel_application_travellers';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable(TABLE_NAME, {
      ta_traveller_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ta_traveller_travelapp_id: {
        type: Sequelize.INTEGER
      },
      ta_traveller_name: {
        type: Sequelize.STRING
      },
      ta_traveller_phone: {
        type: Sequelize.STRING
      },
      ta_traveller_t7: {
        type: Sequelize.STRING,
        allowNull: true
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
