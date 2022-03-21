'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
const leaveTypeModel = require('./LeaveType')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class leaveAccrual extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getAllLeaveAccruals(){
      return await leaveAccrual.findAll({
        include:[{model:employeeModel, as:'employee'}, {model:leaveTypeModel, as:'leave_type'}]
      })
    }
  };
  leaveAccrual.init({
    lea_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    lea_emp_id: DataTypes.INTEGER,
    lea_month:DataTypes.INTEGER,
    lea_year: DataTypes.INTEGER,
    lea_leave_type: DataTypes.INTEGER,
    lea_rate: DataTypes.DECIMAL,

  }, {
    sequelize,
    modelName: 'leaveAccrual',
    tableName: 'leave_accruals'
  });
  leaveAccrual.belongsTo(employeeModel, {as:'employee', foreignKey:'lea_emp_id'})
  leaveAccrual.belongsTo(leaveTypeModel, {as:'leave_type', foreignKey:'lea_leave_type'})
  return leaveAccrual;
};
