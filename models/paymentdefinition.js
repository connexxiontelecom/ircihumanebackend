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
    pd_total_gross_ii: DataTypes.INTEGER,
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
pd amount: 1 adjusted gross, 2 is adjusted basic, 3 full gross
pd percentage is percentage to be charged on pd_amount
pd_payment_type (1 is income, 2 is deduction)
pd_payment_variant ( 1 = standard, 2  = variation)
pd_payment_taxable ( 1 = taxable, 2 = non taxable)
pd_basic (1 basic, 0 not basic)
pd_tax ( 1= Tax, 0 = not tax)
pd_welfare ( 1 = welfare, 0 = non welfare)
pd_value ( 1 = flat, 2 is computed)
pd_amount ( 1 adjusted gross, 2 is adjusted basic, 3 full gross, 5 adjusted gross 2)
pd_total_gross ( 1 = sum to gross, 0 = No)


 */
