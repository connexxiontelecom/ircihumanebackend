'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reconciliation extends Model {}
  reconciliation.init(
    {
      r_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      r_employee_id: DataTypes.INTEGER,
      r_employee_t7: DataTypes.STRING,
      r_employee_d7: DataTypes.INTEGER,
      r_employee_name: DataTypes.STRING,
      r_month: DataTypes.STRING,
      r_year: DataTypes.STRING,
      r_location_id: DataTypes.STRING,
      r_gross: DataTypes.DOUBLE,
      r_net: DataTypes.DOUBLE,
      r_previous_gross: DataTypes.DOUBLE,
      r_previous_net: DataTypes.DOUBLE,
      r_variance_gross: DataTypes.DOUBLE,
      r_variance_net: DataTypes.DOUBLE,
      r_comment: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'reconciliation',
      tableName: 'reconciliations'
    }
  );
  return reconciliation;
};
