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
            'leave_types',
            'lt_rate',
            {
              type: Sequelize.DOUBLE,
              allowNull:true
            }
        ),
        queryInterface.addColumn(
            'leave_types',
            'lt_mode',
            {
              type:Sequelize.INTEGER,
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
