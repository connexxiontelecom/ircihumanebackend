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
        'public_holidays',
        'ph_to_day',
        {
          type: Sequelize.INTEGER,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'public_holidays',
        'ph_to_month',
        {
          type: Sequelize.INTEGER,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'public_holidays',
        'ph_to_year',
        {
          type: Sequelize.INTEGER,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'public_holidays',
        'ph_to_date',
        {
          type: Sequelize.DATE,
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
