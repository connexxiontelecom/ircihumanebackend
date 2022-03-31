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

    static async getPreviousApplications(empId, currentAppId){
      return await leaveApplication.findAll({
        where:{leapp_empid:empId},
        include:[{model:Employee, as:'employee'}, {model:LeaveType, as:'leave_type'}],
        order:[['leapp_id', 'DESC']]
      })
    }

     static async getLeaveApplicationById(leaveId){
      return await leaveApplication.findOne({
        where:{leapp_id:leaveId}
      })
    }



    static async getApprovedApplications(){
      return await leaveApplication.findAll({
        where:{leapp_status:1}, //approved
        include:[{model:Employee, as:'employee'}, {model:LeaveType, as:'leave_type'}],
        order:[['leapp_id', 'DESC']]
      })
    }

    static async updateLeaveAppStatus(leaveId, status){
      return await leaveApplication.update({
      leapp_status:status},
        {where:{leapp_id:leaveId}
      });
    }

    static async updateLeaveAppPeriod(leaveId, start, end){
      return await leaveApplication.update({
          leapp_start_date:start,
          leapp_end_date:end,
        },
        {where:{leapp_id:leaveId}
        });
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
    leapp_alt_email: DataTypes.STRING,
    leapp_alt_phone: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'leaveApplication',
    tableName: 'leave_applications'
  });

  leaveApplication.belongsTo(LeaveType, { foreignKey: 'leapp_leave_type', as:'leave_type'})
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


  return leaveApplication;



};
