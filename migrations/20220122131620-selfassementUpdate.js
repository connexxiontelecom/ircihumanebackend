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
          'self_assessments',
          'sa_eya_id',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            defaultValue: 0
          }
      ),
      queryInterface.addColumn(
          'self_assessments',
          'sa_response',
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
