'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');
const employeeModel = require('./Employee')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class salarygrossarchive extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }


    static async archiveSalary(data){
      return await salarygrossarchive.create(data)
    }


    static async getSalaryArchives(){
      return await salarygrossarchive.findAll({
        include:{model: employeeModel, as: 'employee'}
      });
    }

  };
  salarygrossarchive.init({
    sga_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    sga_empid: DataTypes.INTEGER,
    sga_prev_salary: {
      type: DataTypes.DOUBLE,
      defaultValue:0,
    },
    sga_new_salary: {
      type: DataTypes.DOUBLE,
      defaultValue:0,
    },
    sga_reason: DataTypes.TEXT,
    sga_attachment: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'salarygrossarchive',
    tableName: 'salarygrossarchives'
  });


  salarygrossarchive.belongsTo(employeeModel, { as: 'employee', foreignKey: 'sga_empid'})

  return salarygrossarchive;
};
