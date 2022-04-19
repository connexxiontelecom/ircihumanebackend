'use strict';
const {
  Model
} = require('sequelize');

const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)

module.exports = (sequelize, DataTypes) => {
  class supervisorAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getEmployeeSupervisor(empId){
      return await supervisorAssignment.findOne({where:{sa_emp_id:empId}})
    }

    static async getListOfEmployees(supervisorId){
      return await supervisorAssignment.findAll({where:{sa_supervisor_id:supervisorId}})
    }


  };
  supervisorAssignment.init({
    sa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    sa_emp_id: DataTypes.INTEGER,
    sa_supervisor_id: DataTypes.INTEGER,
    sa_status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'supervisorAssignment',
    tableName: 'supervisor_assignments'
  });

  supervisorAssignment.belongsTo(Employee, {as: 'employee', foreignKey: 'sa_emp_id'})
  supervisorAssignment.hasMany(Employee, { foreignKey: 'emp_id' })

  supervisorAssignment.belongsTo(Employee, {as: 'supervisor', foreignKey: 'sa_supervisor_id'})
  supervisorAssignment.hasMany(Employee, { foreignKey: 'emp_id' })

  return supervisorAssignment;
};
