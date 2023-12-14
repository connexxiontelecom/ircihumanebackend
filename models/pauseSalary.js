'use strict';
const { Model } = require('sequelize');
const { sequelize, Sequelize } = require('../services/db');
const Employee = require('../models/Employee')(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
  class PauseSalary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PauseSalary.init(
    {
      ps_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ps_empid: DataTypes.INTEGER,
      ps_month: DataTypes.STRING,
      ps_year: DataTypes.STRING,
      ps_created_by: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'PauseSalary',
      tableName: 'pause_salary'
    }
  );

  PauseSalary.belongsTo(Employee, { as: 'employee', foreignKey: 'salary_empid' });
  PauseSalary.hasMany(Employee, { foreignKey: 'emp_id' });
  return PauseSalary;
};
