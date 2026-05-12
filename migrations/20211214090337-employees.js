'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable('employees',
        {
          emp_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          emp_unique_id: {
            type: Sequelize.STRING
          },
          emp_first_name:{
            type:Sequelize.STRING
          },
          emp_other_name:{
            type:Sequelize.STRING,
            allowNull:true
          },
          emp_last_name:{
            type:Sequelize.STRING
          },
          emp_dob:{
            type:Sequelize.DATE,
            allowNull:true
          },
          emp_personal_email:{
            type:Sequelize.STRING,
            allowNull:true,
            unique:true,
          },
          emp_office_email:{
            type:Sequelize.STRING,
            allowNull:true,
            unique:true,
          },
          emp_phone_no:{
            type:Sequelize.STRING,
            allowNull:true,
            unique:true,
          },
          emp_qualification:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_location_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_subsidiary_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_job_role_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_grade_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_account_no:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_bank_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_hmo_no:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_hmo_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_pensionable:{
            type:Sequelize.INTEGER,
            allowNull:true,
            comment:'0=Not pensionable,1=pensionable'
          },
          emp_pension_no:{
            type:Sequelize.STRING,
            allowNull:true
          },
          emp_pension_id:{
            type:Sequelize.STRING,
            allowNull:true
          },
          emp_paye_no:{
            type:Sequelize.STRING,
            allowNull:true
          },
          emp_passport:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_nysc_details:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_nysc_document:{
            type:Sequelize.STRING,
            allowNull:true,
          },
          emp_state_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_lga_id:{
            type:Sequelize.INTEGER,
            allowNull:true,
          },
          emp_marital_status: {
            type:Sequelize.INTEGER,
          allowNull:true
          },
          emp_spouse_name: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_spouse_phone_no: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_next_of_kin_name: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_next_of_kin_address: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_next_of_kin_phone_no: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_ailments: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_blood_group: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_genotype: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_emergency_name: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_emergency_contact: {
            type: Sequelize.STRING,
          allowNull:true
          },
          nationality: {
            type: Sequelize.STRING,
          allowNull:true
          },
          emp_employment_date: {
            type:Sequelize.DATE,
            allowNull:true
          },
          emp_status: {
            type:Sequelize.INTEGER,
            allowNull:true,
            comment: '0 == Fired 1 == Probationary 2 == Confirmed 3 == Retired'
          },
          emp_stop_date: {
            type:Sequelize.DATE,
            allowNull:true
          },
          emp_salary_structure_setup: {
            type:Sequelize.INTEGER,
            allowNull:true,
            default: 0,
            comment:'0 == not setup, 1 == setup'
          },
          emp_salary_structure_category: {
            type:Sequelize.INTEGER,
            allowNull:true,
            comment:'0 == personalize, any other value, categorized'
          },
          emp_tax_amount: {
            type:Sequelize.DOUBLE,
            allowNull:true,
            default:0
          },


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
