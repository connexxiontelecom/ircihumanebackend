'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('severance_pay', {
      sp_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sp_empid: {
        type: Sequelize.INTEGER
      },
      sp_d7: {
        type: Sequelize.STRING
      },
      sp_t7: {
        type: Sequelize.STRING
      },
      sp_amount: {
        type: Sequelize.DOUBLE,
        defaultValue:0,
      },
      sp_month: {
        type: Sequelize.STRING,
        allowNull:true,
      },
      sp_year: {
        type: Sequelize.STRING,
        allowNull:true,
      },
      sp_created_by: {
        type: Sequelize.INTEGER
      },
      sp_location_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable('salary_increments')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
