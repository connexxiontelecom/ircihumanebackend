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
        'performance_plan_master',
        'ppm_accomplishments',
        {
          type: Sequelize.TEXT,
          allowNull:true,
        }
      ),
      queryInterface.addColumn(
        'performance_plan_master',
        'ppm_challenges',
        {
          type: Sequelize.TEXT,
          allowNull:true,
          defaultValue:0
        }
      ),
      queryInterface.addColumn(
        'performance_plan_master',
        'ppm_general_comments',
        {
          type: Sequelize.TEXT,
          allowNull:true,
          defaultValue:0
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
