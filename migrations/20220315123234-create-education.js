'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('education', {
      e_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      e_emp_id:{
        type:Sequelize.INTEGER,
        allowNull:true,
      },
      e_institution: {
        type: Sequelize.STRING
      },
      e_program: {
        type: Sequelize.STRING
      },
      e_qualification: {
        type: Sequelize.STRING
      },
      e_start_date: {
        type: Sequelize.DATE
      },
      e_end_date: {
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
    await queryInterface.dropTable('Education');
  }
};
