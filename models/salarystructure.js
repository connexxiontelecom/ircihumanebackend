'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const PaymentDefinition = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)

module.exports = (sequelize, DataTypes) => {
  class salaryStructure extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  salaryStructure.init({
    ss_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    ss_empid: DataTypes.INTEGER,
    ss_pd: DataTypes.INTEGER,
    ss_amount: DataTypes.DOUBLE,
    ss_grade: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'salaryStructure',
    tableName: 'salary_structures'
  });

  salaryStructure.belongsTo(PaymentDefinition, {as: 'payment', foreignKey: 'ss_pd'})
  salaryStructure.hasMany(PaymentDefinition, { foreignKey: 'pd_id' })

  salaryStructure.belongsTo(Employee, {as: 'employee', foreignKey: 'ss_empid'})
  salaryStructure.hasMany(Employee, { foreignKey: 'emp_id' })

  return salaryStructure;
};
