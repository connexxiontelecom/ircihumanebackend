'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('queries', {
      q_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      q_query_type: {
        type: Sequelize.INTEGER
      },
      q_queried_by:{
        type: Sequelize.INTEGER,
        comment:"Issuer",
        allowNull:true
      },
      q_queried:{
        type: Sequelize.INTEGER,
        comment:"person queried",
        allowNull:true
      },
      q_body: {
        type: Sequelize.TEXT
      },
      q_subject: {
        type: Sequelize.STRING
      },
      q_attachment: {
        type: Sequelize.STRING
      },
      q_is_seen: {
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:'0=not seen,1=seen'
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
    await queryInterface.dropTable('queries');
  }
};
