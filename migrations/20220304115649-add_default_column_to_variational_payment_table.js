'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
   /* return queryInterface.add('variational_payments', [{

    }])*/
    return Promise.all([
      queryInterface.addColumn(
          'variational_payments',
          'vp_default_id',
          {
            type: Sequelize.INTEGER,
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
