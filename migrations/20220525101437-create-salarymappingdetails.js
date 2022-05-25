'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_mapping_details', {
      smd_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      smd_master_id: {
        type: Sequelize.INTEGER
      },
      smd_ref_code: {
        type: Sequelize.STRING
      },
      smd_employee_t7: {
        type: Sequelize.STRING
      },

      smd_donor_t1:{
        type: Sequelize.STRING
      },

      smd_salary_expense_t2s:{
        type: Sequelize.STRING
      },

      smd_benefit_expense_t2b:{
        type: Sequelize.STRING
      },

      smd_allocation:{
        type: Sequelize.DOUBLE
      },

      smd_posted:{
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
    await queryInterface.dropTable('salary_mapping_details');
  }
};