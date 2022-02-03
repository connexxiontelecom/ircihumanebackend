'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('variational_payments',{
      vp_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vp_emp_id: {
        type: Sequelize.INTEGER,
        allowNull:true
      },
      vp_payment_def_id:{
        type: Sequelize.INTEGER,
        allowNull:true,
      },
      vp_amount:{
        type:Sequelize.DOUBLE,
        allowNull:true
      },
      vp_confirm:{
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:'0=Pending,1=Approved,2=Discarded'
      },
      vp_payment_month:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      vp_payment_year:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      vp_confirmed_by:{
        type:Sequelize.INTEGER,
        allowNull:true
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
