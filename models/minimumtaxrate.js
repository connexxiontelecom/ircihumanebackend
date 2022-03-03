'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class minimumTaxRate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  minimumTaxRate.init({
    mtr_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    mtr_rate: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'minimumTaxRate',
    tableName: 'minimum_tax_rates'

  });
  return minimumTaxRate;
};
