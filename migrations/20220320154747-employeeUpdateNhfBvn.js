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
          'emp_nhf',
          {
            type: Sequelize.STRING,
            allowNull:true
          }
      ),
      queryInterface.addColumn(
          'employees',
          'emp_bvn',
          {
            type: Sequelize.STRING,
            allowNull:true
          }
      ),

      queryInterface.addColumn(
          'employees',
          'emp_type',
          {
            type: Sequelize.INTEGER,
            allowNull:true,
            comment:'1=National, 2=Expatriate'

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
