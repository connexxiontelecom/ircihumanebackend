'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tax_reliefs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      emp_id: {
        type: Sequelize.STRING
      },
      relief_type_id: {
        type: Sequelize.INTEGER
      },
      amount_provided: {
        type: Sequelize.FLOAT,
        default: 0,
      },
      relief_amount: {
        type: Sequelize.FLOAT,
        default: 0,
      },
      start_date: {
        type: Sequelize.DATE,
        nullable: true,
      },
      end_date: {
        type: Sequelize.DATE,
        nullable: true,
      },
      document: {
        type: Sequelize.STRING,
        nullable: true,
      },
      status: {
        type: Sequelize.INTEGER,
        nullable: true,
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
    await queryInterface.dropTable('tax_reliefs');
  }
};
