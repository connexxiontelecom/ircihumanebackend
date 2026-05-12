'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('salarygrossarchives', {
      sga_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sga_empid: {
        type: Sequelize.INTEGER
      },
      sga_prev_salary: {
        type: Sequelize.DOUBLE,
        defaultValue:0,
      },
      sga_new_salary: {
        type: Sequelize.DOUBLE,
        defaultValue:0,
      },
      sga_reason: {
        type: Sequelize.STRING
      },
      sga_attachment: {
        type: Sequelize.STRING
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
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.dropTable('salarygrossarchives');
  }
};
