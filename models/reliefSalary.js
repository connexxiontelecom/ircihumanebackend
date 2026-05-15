'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReliefSalary extends Model {
    static associate(models) {
      ReliefSalary.belongsTo(models.ReliefType, {
        foreignKey: 'relief_id',
        as: 'reliefType'
      });
      ReliefSalary.belongsTo(models.Employee, {
        foreignKey: 'emp_id',
        as: 'employee'
      });
    }
  }

  ReliefSalary.init(
    {
      relief_id: DataTypes.INTEGER,
      emp_id: DataTypes.INTEGER,
      month: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      relief_amount: DataTypes.DECIMAL(14, 2)
    },
    {
      sequelize,
      modelName: 'ReliefSalary',
      tableName: 'relief_salaries'
    }
  );

  return ReliefSalary;
};
