'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_grades', {
      sg_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sg_name: {
        type: Sequelize.STRING,
        unique: true
      },
      sg_minimum: {
        type: Sequelize.DOUBLE
      },
      sg_midpoint: {
        type: Sequelize.DOUBLE
      },
      sg_maximum: {
        type: Sequelize.DOUBLE
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
    await queryInterface.dropTable('salary_grades');
  }
};
