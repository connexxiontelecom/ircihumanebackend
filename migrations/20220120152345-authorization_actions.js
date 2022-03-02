'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('authorization_actions',{
      auth_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      auth_travelapp_id: {
        type: Sequelize.INTEGER
      },
      auth_officer_id: {
        type: Sequelize.INTEGER
      },
      auth_status:{type:Sequelize.INTEGER, defaultValue:0,comment:"0=pending 1=approved 2=Declined"},
      auth_type:{type:Sequelize.INTEGER, defaultValue:1, comment:"1=leave,2=time-sheet,3=travel,4=self"},
      auth_comment:{type:Sequelize.STRING, allowNull:true},
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    })
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
