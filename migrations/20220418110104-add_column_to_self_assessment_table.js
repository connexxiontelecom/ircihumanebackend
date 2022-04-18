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
        'sa_master_id',
        {
          type: Sequelize.INTEGER,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'self_assessments',
        'sa_update',
        {
          type: Sequelize.TEXT,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'self_assessments',
        'sa_accomplishment',
        {
          type: Sequelize.TEXT,
          allowNull:true
        }
      ), queryInterface.addColumn(
        'self_assessments',
        'sa_challenges',
        {
          type: Sequelize.TEXT,
          allowNull:true
        }
      ),
      queryInterface.addColumn(
        'self_assessments',
        'sa_support_needed',
        {
          type: Sequelize.TEXT,
          allowNull:true
        }
      ),queryInterface.addColumn(
        'self_assessments',
        'sa_next_steps',
        {
          type: Sequelize.TEXT,
          allowNull:true
        }
      ),queryInterface.addColumn(
        'self_assessments',
        'sa_gs_id',
        {
          type: Sequelize.TEXT,
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
