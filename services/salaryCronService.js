const { sequelize, Sequelize } = require('./db');
const SalaryCronModel = require('../models/salary_cron')(sequelize, Sequelize.DataTypes);

async function addSalaryCron(salaryCron) {
  return await SalaryCronModel.create({
    sc_month: salaryCron.sc_month,
    sc_year: salaryCron.sc_year,
    sc_location_id: salaryCron.sc_location_id,
    sc_location_name: salaryCron.sc_location_name,
    sc_location_code: salaryCron.sc_location_code,
    sc_total_deduction: salaryCron.sc_total_deduction,
    sc_gross: salaryCron.sc_gross,
    sc_net: salaryCron.sc_net,
    sc_employee_count: salaryCron.sc_employee_count
  });
}

async function deleteSalaryCron(month, year, location) {
  return await SalaryCronModel.destroy({
    where: {
      sc_month: month,
      sc_year: year,
      sc_location_id: location
    }
  });
}

async function getSalaryCronByMonthYearLocation(month, year, location) {
  return await SalaryCronModel.findOne({
    where: {
      sc_month: month,
      sc_year: year,
      sc_location_id: location
    }
  });
}
module.exports = {
  addSalaryCron,
  deleteSalaryCron,
  getSalaryCronByMonthYearLocation
};
