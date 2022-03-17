'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('announcements', {
      a_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      a_author:{
        type:Sequelize.INTEGER,
      },
      a_title: {
        type: Sequelize.STRING
      },
      a_attachment: {
        type: Sequelize.STRING
      },
      a_body: {
        type: Sequelize.TEXT
      },
      a_target: {
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
    await queryInterface.dropTable('announcements');
  }
};
