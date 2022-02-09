'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary', {
      salary_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      salary_empid: {
        type: Sequelize.INTEGER
      },
      salary_paymonth: {
        type: Sequelize.TEXT
      },
      salary_payyear: {
        type: Sequelize.TEXT
      },
      salary_pd: {
        type: Sequelize.INTEGER
      },
      salary_share: {
        type: Sequelize.DOUBLE
      },
      salary_tax: {
        type: Sequelize.INTEGER
      },
      salary_confirmed: {
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
    await queryInterface.dropTable('salary');
  }
};
