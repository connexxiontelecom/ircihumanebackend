'use strict';
const {
  Model, where
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const PaymentDefinition = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const SalaryGrade = require("../models/salarygrade")(sequelize, Sequelize.DataTypes)

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

    static async getEmployeeSalaryStructure(empId){
      return await salaryStructure.findAll({
        where:{ss_empid:empId},
        include:{model:PaymentDefinition, as:'payment'}
      })
    }

    static async updateSalaryStructureAmount(empId, amount, paymentDefId){
      return await salaryStructure.update({
        ss_amount : amount,
      },{
        where:{
          ss_empid:empId,
          ss_pd:paymentDefId
        }
      })
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

  //salaryStructure.hasMany(PaymentDefinition, { foreignKey: 'pd_id', as: 'payments'})

  salaryStructure.belongsTo(Employee, {as: 'employee', foreignKey: 'ss_empid'})
  salaryStructure.hasMany(Employee, { foreignKey: 'emp_id' })

  salaryStructure.belongsTo(SalaryGrade, {as: 'salary_grade', foreignKey: 'ss_grade'})
  salaryStructure.hasMany(SalaryGrade, { foreignKey: 'sg_id' })

  return salaryStructure;
};
