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
          'time_allocations',
          'ta_ref_no',
          {
            type: Sequelize.STRING,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'time_allocations',
          'ta_comment',
          {
            type: Sequelize.STRING,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'time_allocations',
          'ta_date_approved',
          {
            type: Sequelize.DATE,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'time_allocations',
          'ta_approved_by',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
          }
      ),
      queryInterface.addColumn(
          'time_allocations',
          'ta_status',
          {
            type: Sequelize.INTEGER,
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
