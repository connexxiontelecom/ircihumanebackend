'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.createTable('master_lists', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        location_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        regular_term: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        limited_term: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        short_term: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        male: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        female: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        total: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        percentage_workforce: {
          type: Sequelize.DOUBLE,
          allowNull: false
        },
        cost_per_site: {
          type: Sequelize.DOUBLE,
          allowNull: false
        },
        percentage_cost_per_site: {
          type: Sequelize.DOUBLE,
          allowNull: false
        },
        new_hire: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        relocate_from: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        relocate_to: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        exit: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        month: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        subCategory: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
