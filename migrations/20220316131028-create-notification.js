'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      n_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      n_subject: {
        type: Sequelize.STRING
      },
      n_body: {
        type: Sequelize.STRING
      },
      n_is_read: {
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:'0=unread,1=read'
      },
      n_user_id: {
        type: Sequelize.INTEGER
      },
      n_post_id: {
        type: Sequelize.INTEGER
      },
      n_url: {
        type: Sequelize.TEXT,
        comment:'1=announcement,2=query'
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
    await queryInterface.dropTable('notifications');
  }
};
