'use strict';
const {
  Model
} = require('sequelize');
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
  };
  payrollmonthyearlocation.init({
    pmyl_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    pmyl_month: DataTypes.INTEGER,
    pmyl_year: DataTypes.INTEGER,
    pmyl_location_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'payrollmonthyearlocation',
    tableName: 'payroll_month_year_location'
  });
  return payrollmonthyearlocation;
};