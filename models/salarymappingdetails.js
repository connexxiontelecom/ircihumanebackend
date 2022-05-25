'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salarymappingdetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  salarymappingdetails.init({
    smd_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    smd_master_id: DataTypes.INTEGER,
    smd_ref_code: DataTypes.STRING,
    smd_employee_t7: DataTypes.STRING,
    smd_donor_t1: DataTypes.STRING,
    smd_salary_expense_t2s: DataTypes.STRING,
    smd_benefit_expense_t2b: DataTypes.STRING,
    smd_allocation: DataTypes.DOUBLE,
    smd_status: DataTypes.INTEGER,

  }, {
    sequelize,
    modelName: 'salarymappingdetails',
    tableName: 'salary_mapping_details'
  });
  return salarymappingdetails;
};