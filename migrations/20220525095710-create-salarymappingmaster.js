'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_mapping_master', {
      smm_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      smm_month: {
        type: Sequelize.INTEGER
      },
      smm_year: {
        type: Sequelize.INTEGER
      },
      smm_location: {
        type: Sequelize.INTEGER
      },

      smm_ref_code: {
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
    await queryInterface.dropTable('salary_mapping_master');
  }
};