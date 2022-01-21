'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('travel_applications',{
      travelapp_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      travelapp_employee_id: {
        type: Sequelize.INTEGER
      },
      travelapp_travel_cat: {
        type: Sequelize.INTEGER
      },
      travelapp_purpose:{
        type:Sequelize.STRING,
      },
      travelapp_start_date:{
        type:Sequelize.DATE,
      },
      travelapp_end_date:{
        type:Sequelize.DATE,
      },
      travelapp_total_days:{
        type:Sequelize.INTEGER,
      },
      travelapp_t1_code:{
        type:Sequelize.STRING,
        allowNull:true,
      },
      travelapp_t2_code:{
        type:Sequelize.STRING,
        allowNull:true,
      },
      travelapp_verified_by:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      travelapp_date_verified:{
        type:Sequelize.DATE,
        allowNull:true,
      },
      travelapp_verify_comment:{
        type:Sequelize.STRING,
        allowNull:true,
      },
      travelapp_approved_by:{
        type:Sequelize.INTEGER,
        allowNull:true,
      },
      travelapp_date_approved:{
        type:Sequelize.DATE,
        allowNull:true,
      },
      travelapp_approve_comment:{
        type:Sequelize.STRING,
        allowNull:true,
      },
      travelapp_status:{type:Sequelize.INTEGER, defaultValue:0,comment:"0=pending,1=approved,2=declined"},
      created_at: {
        allowNull: true,
        type: Sequelize.DATE
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
