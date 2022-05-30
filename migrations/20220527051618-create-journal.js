'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('journals', {
      j_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      j_acc_code: {
        type: Sequelize.STRING
      },
      j_date: {
        type: Sequelize.STRING
      },
      j_ref_code: {
        type: Sequelize.STRING
      },
      j_d_c: {
        type: Sequelize.STRING
      },
      j_desc: {
        type: Sequelize.STRING
      },
      j_amount: {
        type: Sequelize.DOUBLE
      },
      j_t1: {
        type: Sequelize.STRING
      },
      j_t2: {
        type: Sequelize.STRING
      },
      j_t3: {
        type: Sequelize.STRING
      },
      j_t4: {
        type: Sequelize.STRING
      },
      j_t5: {
        type: Sequelize.STRING
      },
      j_t6: {
        type: Sequelize.STRING
      },
      j_t7: {
        type: Sequelize.STRING
      },
      j_name: {
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
    await queryInterface.dropTable('journals');
  }
};