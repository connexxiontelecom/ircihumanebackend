'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SeverancePay extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SeverancePay.init(
    {
      sp_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sp_empid: DataTypes.INTEGER,
      sp_d7: DataTypes.STRING,
      sp_t7: DataTypes.STRING,
      sp_amount: DataTypes.DOUBLE,
      sp_month: DataTypes.STRING,
      sp_year: DataTypes.STRING,
      sp_created_by: DataTypes.INTEGER,
      sp_location_id: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'SeverancePay',
      tableName: 'severance_pay'
    }
  );
  return SeverancePay;
};
