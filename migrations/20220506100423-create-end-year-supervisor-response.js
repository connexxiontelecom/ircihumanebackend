'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('end_year_supervisor_responses', {
      eysr_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eysr_master_id: {
        type: Sequelize.INTEGER
      },
      eysr_strength: {
        type: Sequelize.TEXT
      },
      eysr_growth: {
        type: Sequelize.TEXT
      },
      eysr_rating: {
        type: Sequelize.INTEGER
      },
      eysr_additional_comment: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('end_year_supervisor_responses');
  }
};
