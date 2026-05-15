'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('relief_salary');
    if (!table.emp_id) {
      await queryInterface.addColumn('relief_salary', 'emp_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'emp_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    const indexes = await queryInterface.showIndex('relief_salary');
    const hasIndex = indexes.some(
      (idx) => idx.name === 'relief_salary_emp_month_year_relief_idx'
    );
    if (!hasIndex) {
      await queryInterface.addIndex(
        'relief_salary',
        ['emp_id', 'Month', 'Year', 'relief_Id'],
        { name: 'relief_salary_emp_month_year_relief_idx' }
      );
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('relief_salary');
    const indexes = await queryInterface.showIndex('relief_salary');
    const hasIndex = indexes.some(
      (idx) => idx.name === 'relief_salary_emp_month_year_relief_idx'
    );
    if (hasIndex) {
      await queryInterface.removeIndex(
        'relief_salary',
        'relief_salary_emp_month_year_relief_idx'
      );
    }
    if (table.emp_id) {
      await queryInterface.removeColumn('relief_salary', 'emp_id');
    }
  }
};
