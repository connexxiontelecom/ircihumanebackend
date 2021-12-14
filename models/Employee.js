'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Employee extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Employee.init({
        emp_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        emp_unique_id: DataTypes.INTEGER,
        emp_first_name: DataTypes.STRING,
        emp_other_name: DataTypes.STRING,
        emp_last_name: DataTypes.STRING,
        emp_dob: DataTypes.DATE,
        emp_personal_email: DataTypes.STRING,
        emp_office_email: DataTypes.STRING,
        emp_phone_no: DataTypes.STRING,
        emp_qualification: DataTypes.STRING,
        emp_location_id: DataTypes.INTEGER,
        emp_subsidiary_id: DataTypes.INTEGER,
        emp_job_role_id: DataTypes.INTEGER,
        emp_grade_id: DataTypes.INTEGER,
        emp_account_no: DataTypes.STRING,
        emp_bank_id: DataTypes.INTEGER,
        emp_hmo_no: DataTypes.STRING,
        emp_hmo_id:DataTypes.INTEGER,
        emp_pensionable:DataTypes.INTEGER,
        emp_pension_no:DataTypes.STRING,
        emp_pension_id:DataTypes.STRING,
        emp_paye_no:DataTypes.STRING,
        emp_passport:DataTypes.STRING,
        emp_nysc_details:DataTypes.STRING,
        emp_nysc_document:DataTypes.STRING,
        emp_state_id:DataTypes.INTEGER,
        emp_lga_id:DataTypes.INTEGER,
        emp_marital_status:DataTypes.INTEGER,
        emp_spouse_name:DataTypes.STRING,
        emp_spouse_phone_no:DataTypes.STRING,
        emp_next_of_kin_name:DataTypes.STRING,
        emp_next_of_kin_address:DataTypes.STRING,
        emp_next_of_kin_phone_no:DataTypes.STRING,
        emp_ailments:DataTypes.STRING,
        emp_blood_group:DataTypes.STRING,
        emp_genotype:DataTypes.STRING,
        emp_emergency_name:DataTypes.STRING,
        emp_emergency_contact:DataTypes.STRING,
        emp_employment_date:DataTypes.DATE,
        emp_status:DataTypes.INTEGER,
        emp_stop_date:DataTypes.DATE,
        emp_salary_structure_setup:DataTypes.INTEGER,
        emp_salary_structure_category:DataTypes.INTEGER,
        emp_tax_amount:DataTypes.DOUBLE,
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'Employee',
        tableName: 'employees'
    });
    return Employee;
};


