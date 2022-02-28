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
    pd_pr_gross: DataTypes.DOUBLE,
    pd_value: DataTypes.INTEGER,
    pd_amount: DataTypes.INTEGER,
    pd_percentage: DataTypes.DOUBLE,
    pd_tax: DataTypes.INTEGER,
    pd_total_gross: DataTypes.INTEGER,
    pd_welfare: DataTypes.INTEGER

  }, {
    sequelize,
    modelName: 'PaymentDefinition',
    tableName: 'payment_definitions'
  });
  return PaymentDefinition;
};


/*

please read

pd value: 1 is flat, 2 is computed,
pd amount: 1 gross, 2 is basic,
pd percentage is percentage to be charged on pd_amount

 */
