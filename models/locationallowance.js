'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class locationAllowance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  locationAllowance.init({
    la_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    la_payment_id: DataTypes.NUMBER,
    la_location_id: DataTypes.NUMBER,
    la_amount: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'locationAllowance',
    tableName: 'location_allowances'
  });
  return locationAllowance;
};
