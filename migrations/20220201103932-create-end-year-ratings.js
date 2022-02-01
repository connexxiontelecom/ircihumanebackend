'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('end_year_ratings', {
      eyr_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eyr_empid: {
        type: Sequelize.INTEGER
      },
      eyr_year: {
        type: Sequelize.STRING
      },
      eyr_rating: {
        type: Sequelize.INTEGER
      },
      eyr_by: {
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
    await queryInterface.dropTable('end_year_ratings');
  }
};
