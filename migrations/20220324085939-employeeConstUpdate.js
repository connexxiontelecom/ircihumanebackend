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
          'emp_unit_name',
          {
            type: Sequelize.STRING,
            allowNull:true,
            defaultValue:null
          }
      ),

      queryInterface.addColumn(
          'employees',
          'emp_cost_center',
          {
            type: Sequelize.STRING,
            allowNull:true,
            defaultValue:null
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
