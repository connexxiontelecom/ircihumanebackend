'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('employees');
    if (table.nationality) {
      return;
    }
    await queryInterface.addColumn('employees', 'nationality', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('employees');
    if (!table.nationality) {
      return;
    }
    await queryInterface.removeColumn('employees', 'nationality');
  }
};
