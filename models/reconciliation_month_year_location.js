'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reconciliationmonthyearlocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  reconciliationmonthyearlocation.init(
    {
      rmyl_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      rmyl_month: DataTypes.INTEGER,
      rmyl_year: DataTypes.INTEGER,
      rmyl_location_id: DataTypes.INTEGER,
      rmyl_run_by: DataTypes.INTEGER,
      rmyl_comment: DataTypes.STRING,
      rmyl_date: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'reconciliationmonthyearlocation',
      tableName: 'reconciliation_month_year_location'
    }
  );
  return reconciliationmonthyearlocation;
};
