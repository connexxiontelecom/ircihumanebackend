'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('travel_application_breakdown',{
      ta_breakdown_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ta_breakdown_travelapp_id: {
        type: Sequelize.INTEGER
      },
      ta_breakdown_from: {
        type: Sequelize.STRING
      },
      ta_breakdown_date:{
        type:Sequelize.DATE,
      },
      ta_breakdown_mode:{type:Sequelize.INTEGER,defaultValue:1,comment:"1=Road,2=Air"},
      ta_breakdown_prompt:{type:Sequelize.INTEGER,defaultValue:1,comment:"1=AM,2=PM"},
      ta_breakdown_destination:{
        type:Sequelize.STRING,
      },
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
