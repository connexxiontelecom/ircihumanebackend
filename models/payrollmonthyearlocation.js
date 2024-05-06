'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class payrollmonthyearlocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  payrollmonthyearlocation.init(
    {
      pmyl_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      pmyl_month: DataTypes.INTEGER,
      pmyl_year: DataTypes.INTEGER,
      pmyl_location_id: DataTypes.INTEGER,
      pmyl_confirmed: DataTypes.INTEGER,
      pmyl_confirmed_by: DataTypes.TEXT,
      pmyl_confirmed_date: DataTypes.DATE,
      pmyl_authorised: DataTypes.INTEGER,
      pmyl_authorised_by: DataTypes.TEXT,
      pmyl_authorised_date: DataTypes.DATE,
      pmyl_authorised_comment: DataTypes.TEXT,
      pmyl_approved: DataTypes.INTEGER,
      pmyl_approved_by: DataTypes.TEXT,
      pmyl_approved_comment: DataTypes.TEXT,
      pmyl_approved_date: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'payrollmonthyearlocation',
      tableName: 'payroll_month_year_locations'
    }
  );
  return payrollmonthyearlocation;
};
