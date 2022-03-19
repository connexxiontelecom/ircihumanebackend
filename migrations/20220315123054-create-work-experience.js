'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_experiences', {
      we_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      we_emp_id:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      we_organization: {
        type: Sequelize.STRING
      },
      we_job_role: {
        type: Sequelize.STRING
      },
      we_description: {
        type: Sequelize.STRING
      },
      we_start_date: {
        type: Sequelize.DATE
      },
      we_end_date: {
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
    await queryInterface.dropTable('WorkExperiences');
  }
};
