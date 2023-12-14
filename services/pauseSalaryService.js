const { sequelize, Sequelize } = require('./db');
const Employee = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const PauseSalaryService = require('../models/pauseSalary')(sequelize, Sequelize.DataTypes);

async function addPauseSalary(pauseSalary) {
  return await PauseSalaryService.create({
    ps_empid: pauseSalary.ps_empid,
    ps_month: pauseSalary.ps_month,
    ps_year: pauseSalary.ps_year,
    ps_created_by: pauseSalary.ps_created_by
  });
}

function findExistingPauseSalary(empId, month, year) {
  return PauseSalaryService.findOne({
    where: {
      ps_empid: empId,
      ps_month: month,
      ps_year: year
    }
  });
}

function findOnePauseSalary(pauseSalaryId) {
  return PauseSalaryService.findOne({
    where: {
      ps_id: pauseSalaryId
    }
  });
}

function deletePauseSalary(pauseSalaryId) {
  return PauseSalaryService.destroy({
    where: {
      ps_id: pauseSalaryId
    }
  });
}

function findPauseSalaryByMonthYear(month, year) {
  return PauseSalaryService.findAll({
    where: {
      ps_month: month,
      ps_year: year
    },
    include: [{ model: Employee, as: 'employee' }]
  });
}

module.exports = {
  addPauseSalary,
  findExistingPauseSalary,
  findOnePauseSalary,
  deletePauseSalary,
  findPauseSalaryByMonthYear
};
