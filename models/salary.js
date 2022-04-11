'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');

const Pd = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
module.exports = (sequelize, DataTypes) => {
  class salary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  salary.init({
    salary_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    salary_empid: DataTypes.INTEGER,
    salary_paymonth: DataTypes.TEXT,
    salary_payyear: DataTypes.TEXT,
    salary_pd: DataTypes.INTEGER,
    salary_share: DataTypes.DOUBLE,
    salary_tax: DataTypes.INTEGER,
    salary_confirmed: DataTypes.INTEGER,
    salary_amount: DataTypes.DOUBLE,
    salary_approved: DataTypes.INTEGER,
    salary_approved_by: DataTypes.INTEGER,
    salary_approved_date: DataTypes.DATE,
    salary_confirmed_by: DataTypes.INTEGER,
    salary_confirmed_date: DataTypes.DATE,
    salary_location_id: DataTypes.INTEGER,
    salary_jobrole_id: DataTypes.INTEGER,
    salary_department_id: DataTypes.INTEGER,
    salary_grade: DataTypes.TEXT,
    salary_gross: DataTypes.DOUBLE,
    salary_emp_name: DataTypes.TEXT,
    salary_emp_unique_id: DataTypes.TEXT,
    salary_emp_start_date: DataTypes.DATE,
    salary_emp_end_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'salary',
    tableName: 'salary'
  });

  salary.belongsTo(Pd, { as:'payment', foreignKey: 'salary_pd' })
  salary.hasMany(Pd, { foreignKey: 'pd_id' })

  salary.belongsTo(Employee, {as: 'employee', foreignKey: 'salary_empid'})
  salary.hasMany(Employee, { foreignKey: 'emp_id' })



  return salary;
};
