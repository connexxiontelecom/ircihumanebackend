'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaxRate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  TaxRate.init({
    tr_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    tr_band: DataTypes.DECIMAL,
    tr_rate: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'TaxRate',
    tableName: 'tax_rates'
  });
  return TaxRate;
};
