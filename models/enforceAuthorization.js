'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EnforceAuthorization extends Model {}

  EnforceAuthorization.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      updated_by: DataTypes.INTEGER,
      enforce: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE
      },
      updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      modelName: 'EnforceAuthorization',
      tableName: 'enforce_authorization'
    }
  );

  return EnforceAuthorization;
};
