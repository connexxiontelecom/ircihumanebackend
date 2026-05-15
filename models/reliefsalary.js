'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReliefSalary extends Model {
    static associate(models) {
      ReliefSalary.belongsTo(models.TaxRelief, {
        foreignKey: 'relief_Id',
        as: 'taxRelief'
      });
      ReliefSalary.belongsTo(models.Employee, {
        foreignKey: 'emp_id',
        as: 'employee'
      });
    }
  }

  ReliefSalary.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      emp_id: DataTypes.INTEGER,
      relief_Id: DataTypes.INTEGER,
      Month: DataTypes.STRING,
      Year: DataTypes.STRING,
      relief_Amount: DataTypes.FLOAT
    },
    {
      sequelize,
      modelName: 'ReliefSalary',
      tableName: 'relief_salary'
    }
  );

  return ReliefSalary;
};
