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
        'performance_plan_supervisor_response',
        'ppsr_status',
        {
          type: Sequelize.TEXT,
          allowNull:true,
          defaultValue:0,
          comment:'0=pending, 1=approved/closed'
        }
      ),
      queryInterface.addColumn(
        'performance_plan_supervisor_response',
        'ppsr_date_approved',
        {
          type: Sequelize.DATE,
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
