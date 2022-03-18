'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('query_replies', {
      qr_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      qr_reply: {
        type: Sequelize.TEXT
      },
      qr_emp_id: {
        type: Sequelize.INTEGER
      },
      qr_reply_source: {
        type: Sequelize.INTEGER,
        defaultValue:1,
        comment:"1=offender,2=issuer"
      },
      qr_query_id: {
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
    await queryInterface.dropTable('query_replies');
  }
};
