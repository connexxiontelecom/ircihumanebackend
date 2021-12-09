'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentDefinition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  PaymentDefinition.init({
    pd_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    pd_payment_code: DataTypes.STRING,
    pd_payment_name: DataTypes.STRING,
    pd_payment_type: DataTypes.INTEGER,
    pd_payment_variant: DataTypes.INTEGER,
    pd_payment_taxable: DataTypes.INTEGER,
    pd_desc: DataTypes.INTEGER,
    pd_basic: DataTypes.STRING,
    pd_tie_number: DataTypes.STRING,

  }, {
    sequelize,
    modelName: 'PaymentDefinition',
    tableName: 'payment_definitions'
  });
  return PaymentDefinition;
};
