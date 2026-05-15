'use strict';
const { sequelize, Sequelize } = require('../services/db');
const { Model } = require('sequelize');
const TaxRelief = require('../models/taxrelief')(sequelize, Sequelize.DataTypes);

module.exports = (sequelize, DataTypes) => {
  class ReliefSalary extends Model {
    static associate(models) {
      // define association here
    }
  }

  ReliefSalary.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
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

  ReliefSalary.belongsTo(TaxRelief, {
    foreignKey: 'relief_Id',
    as: 'taxRelief'
  });

  return ReliefSalary;
};
