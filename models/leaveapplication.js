'use strict';

const {
  Model
} = require('sequelize');

const {sequelize, Sequelize} = require("../services/db");
const LeaveType = require("../models/LeaveType")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
module.exports = (sequelize, DataTypes) => {
  class leaveApplication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  leaveApplication.init({
    leapp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    leapp_empid: DataTypes.INTEGER,
    leapp_leave_type: DataTypes.INTEGER,
    leapp_start_date: DataTypes.DATE,
    leapp_end_date: DataTypes.DATE,
    leapp_total_days: DataTypes.INTEGER,
    leapp_verify_by: DataTypes.INTEGER,
    leapp_verify_date: DataTypes.DATE,
    leapp_verify_comment: DataTypes.STRING,
    leapp_recommend_by: DataTypes.INTEGER,
    leapp_recommend_date: DataTypes.DATE,
    leapp_recommend_comment: DataTypes.STRING,
    leapp_approve_by: DataTypes.INTEGER,
    leapp_approve_date: DataTypes.DATE,
    leapp_approve_comment: DataTypes.STRING,
    leapp_status: DataTypes.INTEGER,
    leapp_year: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'leaveApplication',
    tableName: 'leave_applications'
  });

  leaveApplication.belongsTo(LeaveType, { foreignKey: 'leapp_leave_type'})
  leaveApplication.hasMany(LeaveType, { foreignKey: 'leave_type_id' })

  leaveApplication.belongsTo(Employee, {as: 'employee', foreignKey: 'leapp_empid'})
  leaveApplication.hasMany(Employee, { foreignKey: 'emp_id' })

  leaveApplication.belongsTo(Employee, {  as: 'verify',  foreignKey: 'leapp_verify_by'})
  leaveApplication.hasMany(Employee, { foreignKey: 'emp_id' })

  leaveApplication.belongsTo(Employee, { as: 'recommend', foreignKey: 'leapp_recommend_by'})
  leaveApplication.hasMany(Employee, {    foreignKey: 'emp_id' })

  leaveApplication.belongsTo(Employee, { as: 'approve', foreignKey: 'leapp_approve_by'})
  leaveApplication.hasMany(Employee, {  foreignKey: 'emp_id' })

  //leaveApplication.belongsTo(Employee, { foreignKey: 'leapp_empid' })

  return leaveApplication;



};
