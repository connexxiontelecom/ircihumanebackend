'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('relief_salaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      relief_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'relief_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      emp_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'emp_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      relief_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
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

    await queryInterface.addIndex('relief_salaries', ['emp_id', 'relief_id', 'month', 'year'], {
      unique: true,
      name: 'relief_salaries_emp_relief_period_unique'
    });
    await queryInterface.addIndex('relief_salaries', ['month', 'year'], {
      name: 'relief_salaries_month_year_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('relief_salaries');
  }
};
