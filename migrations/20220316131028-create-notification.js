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
      body: {
        type: Sequelize.STRING
      },
      is_read: {
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:'0=unread,1=read'
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      post_id: {
        type: Sequelize.INTEGER
      },
      post_type: {
        type: Sequelize.INTEGER,
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
