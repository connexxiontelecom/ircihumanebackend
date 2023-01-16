'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');
const employeeModel = require('./Employee')(sequelize, Sequelize)

module.exports = (sequelize, DataTypes) => {
  class salaryIncrement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static async addSalaryIncrement(data){
      return await salaryIncrement.create(data)
    }

    static async getSalaryIncrements(){
      return await salaryIncrement.findAll({
        include:{model: employeeModel, as: 'employee'}
      });
    }

    static async deleteSalaryIncrementRecords(){
      return await salaryIncrement.destroy({
        truncate: true,
        cascade: false,
      })
    }


  };
  salaryIncrement.init({
    si_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    si_empid: DataTypes.INTEGER,
    si_d7: DataTypes.INTEGER,
    si_new_gross: {
      type: DataTypes.DOUBLE,
      defaultValue:0,
    },
    si_reason: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
  }, {
    sequelize,
    modelName: 'salaryIncrement',
    tableName: 'salary_increments'
  });




  salaryIncrement.belongsTo(employeeModel, { as: 'employee', foreignKey: 'si_empid'})


  return salaryIncrement;
};
