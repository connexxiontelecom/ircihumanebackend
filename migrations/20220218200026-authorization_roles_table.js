'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('authorization_roles',{
      ar_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ar_title: {
        type: Sequelize.TEXT
      },
      ar_type:{
        type: Sequelize.INTEGER,
        defaultValue:1,
        allowNull:true,
        comment:"1=leave,2=time sheet,3=travel"
      },
      created_at:Sequelize.DATE,
      updated_at:Sequelize.DATE,
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
