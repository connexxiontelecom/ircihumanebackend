'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_accruals', {
      lea_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      lea_emp_id: {
        type: Sequelize.INTEGER
      },
      lea_month: {
        type: Sequelize.INTEGER
      },
      lea_year: {
        type: Sequelize.INTEGER
      },
      lea_leave_type: {
        type: Sequelize.INTEGER
      },
      lea_rate: {
        type: Sequelize.DECIMAL
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
    await queryInterface.dropTable('leaveAccruals');
  }
};
