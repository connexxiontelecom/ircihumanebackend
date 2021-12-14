'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('employee_categories',
        {
          ec_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          ec_name: {
            type: Sequelize.STRING
          },
          created_at: {
            allowNull: true,
            type: Sequelize.DATE
          },
          updated_at: {
            allowNull: true,
            type: Sequelize.DATE
          }
        })
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
