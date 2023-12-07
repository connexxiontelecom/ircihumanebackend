const { sequelize, Sequelize } = require('./db');
const PauseSalaryService = require('../models/pauseSalary')(sequelize, Sequelize.DataTypes);

async function addPauseSalary(pauseSalary) {
  return await PauseSalaryService.create({
    ps_empid: pauseSalary.ps_empid,
    ps_month: pauseSalary.ps_month,
    ps_year: pauseSalary.ps_year,
    ps_created_by: pauseSalary.ps_created_by
  });
}

async function findExistingPauseSalary(empId, month, year) {
  return await PauseSalaryService.findOne({
    where: {
      ps_empid: empId,
      ps_month: month,
      ps_year: year
    }
  });
}

module.exports = {
  addPauseSalary,
  findExistingPauseSalary
};
