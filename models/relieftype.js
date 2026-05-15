'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReliefType extends Model {
    static associate(models) {
      ReliefType.hasMany(models.TaxRelief, {
        foreignKey: 'relief_type_id',
        as: 'taxReliefs'
      });
      ReliefType.hasMany(models.ReliefSalary, {
        foreignKey: 'relief_id',
        as: 'reliefSalaries'
      });
    }
  }

  ReliefType.init(
    {
      relief_name: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'ReliefType',
      tableName: 'relief_types'
    }
  );

  return ReliefType;
};
