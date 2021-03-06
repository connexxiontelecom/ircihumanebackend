'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
module.exports = (sequelize, DataTypes) => {
  class timesheet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async updateTimesheetStatus(ref_no, status){
      return await timesheet.update({
        ts_ref_no:status,
      },{
        where:{
          ts_ref_no:ref_no
        }
      })
    }
  };
  timesheet.init(
      {
    ts_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    ts_emp_id: DataTypes.INTEGER,
    ts_month: DataTypes.TEXT,
    ts_year: DataTypes.TEXT,
    ts_day: DataTypes.TEXT,
    ts_start: DataTypes.TEXT,
    ts_end: DataTypes.TEXT,
    ts_duration: DataTypes.DOUBLE,
    ts_ref_no: DataTypes.TEXT,
    ts_status: DataTypes.TEXT,
    ts_is_present: DataTypes.INTEGER,

  }, {
    sequelize,
    modelName: 'TimeSheet',
    tableName: 'time_sheets'
  });
  timesheet.belongsTo(Employee, { foreignKey: 'ts_emp_id' })
  return timesheet;
};
