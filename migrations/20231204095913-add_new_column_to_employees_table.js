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
        'employees',
        'emp_probation_end_date',
        {
          type: Sequelize.DATE,
          allowNull:true,
        }
      ),
      queryInterface.addColumn(
        'employees',
        'emp_probation',
        {
          type: Sequelize.STRING,
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
