'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class payrollMonthYear extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  payrollMonthYear.init({
    pym_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    pym_month: DataTypes.STRING,
    pym_year: DataTypes.STRING,
     }, {
    sequelize,
    modelName: 'payrollMonthYear',
    tableName: 'payroll_month_year'
  });
  return payrollMonthYear;
};
