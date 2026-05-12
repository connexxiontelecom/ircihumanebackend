'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salarycron extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  salarycron.init(
    {
      sc_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      sc_month: DataTypes.INTEGER,
      sc_year: DataTypes.INTEGER,
      sc_location_id: DataTypes.INTEGER,
      sc_location_name: DataTypes.STRING,
      sc_location_code: DataTypes.STRING,
      sc_total_deduction: DataTypes.DOUBLE,
      sc_gross: DataTypes.DOUBLE,
      sc_net: DataTypes.DOUBLE,
      sc_employee_count: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'salarycron',
      tableName: 'salary_cron'
    }
  );
  return salarycron;
};
