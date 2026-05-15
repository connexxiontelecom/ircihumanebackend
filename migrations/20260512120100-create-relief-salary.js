'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('relief_salary', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      relief_Id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Month: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Year: {
        type: Sequelize.STRING,
        allowNull: true
      },
      relief_Amount: {
        type: Sequelize.FLOAT,
        allowNull: true
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
    await queryInterface.dropTable('relief_salary');
  }
};
