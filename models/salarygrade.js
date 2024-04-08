'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salaryGrade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  salaryGrade.init(
    {
      sg_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      sg_name: DataTypes.STRING,
      sg_minimum: DataTypes.DOUBLE,
      sg_midpoint: DataTypes.DOUBLE,
      sg_maximum: DataTypes.DOUBLE,
      sg_col_allowance: DataTypes.DOUBLE
    },
    {
      sequelize,
      modelName: 'salaryGrade',
      tableName: 'salary_grades'
    }
  );
  return salaryGrade;
};
