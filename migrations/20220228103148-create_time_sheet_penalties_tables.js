'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('time_sheet_penalties',{
      tsp_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tsp_emp_id: {
        type: Sequelize.INTEGER
      },
      tsp_month:{
        type: Sequelize.INTEGER,
        allowNull:true,
      },
      tsp_year:{
        type: Sequelize.INTEGER,
        allowNull:true,
      },
      tsp_amount:{
        type: Sequelize.DOUBLE,
        allowNull:true,
      },
      tsp_days_absent:{
        type: Sequelize.INTEGER,
        allowNull:true,
      },
      tsp_status:{
        type: Sequelize.INTEGER,
        allowNull:true,
        defaultValue:0,
        comment:'0=yet to be deducted,1=deducted'
      },
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
