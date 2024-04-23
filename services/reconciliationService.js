const { sequelize, Sequelize } = require('./db');
const ReconciliationModel = require('../models/reconciliations')(sequelize, Sequelize.DataTypes);
const ReconciliationMonthYearLocationModel = require('../models/reconciliation_month_year_location')(sequelize, Sequelize.DataTypes);

async function addReconciliation(reconciliation) {
  return await ReconciliationModel.create({
    r_employee_id: reconciliation.r_employee_id,
    r_employee_t7: reconciliation.r_employee_t7,
    r_employee_d7: reconciliation.r_employee_d7,
    r_employee_name: reconciliation.r_employee_name,
    r_month: reconciliation.r_month,
    r_year: reconciliation.r_year,
    r_location_id: reconciliation.r_location_id,
    r_gross: reconciliation.r_gross,
    r_net: reconciliation.r_net,
    r_previous_net: reconciliation.r_previous_net,
    r_previous_gross: reconciliation.r_previous_gross,
    r_variance_gross: reconciliation.r_variance_gross,
    r_variance_net: reconciliation.r_variance_net,
    r_comment: reconciliation.r_comment
  });
}

async function updateReconciliation(reconciliation, r_id) {
  return await ReconciliationModel.update(
    {
      r_employee_id: reconciliation.r_employee_id,
      r_employee_t7: reconciliation.r_employee_t7,
      r_employee_d7: reconciliation.r_employee_d7,
      r_employee_name: reconciliation.r_employee_name,
      r_month: reconciliation.r_month,
      r_year: reconciliation.r_year,
      r_location_id: reconciliation.r_location_id,
      r_gross: reconciliation.r_gross,
      r_net: reconciliation.r_net,
      r_previous_net: reconciliation.r_previous_net,
      r_previous_gross: reconciliation.r_previous_gross,
      r_variance_gross: reconciliation.r_variance_gross,
      r_variance_net: reconciliation.r_variance_net,
      r_comment: reconciliation.r_comment
    },
    {
      where: {
        r_id: r_id
      }
    }
  );
}

async function addReconciliationMonthYearLocation(rmyl) {
  return await ReconciliationMonthYearLocationModel.create({
    rmyl_month: rmyl.rmyl_month,
    rmyl_year: rmyl.rmyl_year,
    rmyl_location_id: rmyl.rmyl_location_id,
    rmyl_run_by: rmyl.rmyl_run_by,
    rmyl_date: rmyl.rmyl_date,
    rmyl_comment: rmyl.rmyl_comment
  });
}

async function getReconciliationMonthYearLocation(rmyl_month, rmyl_year, rmyl_location_id) {
  return await ReconciliationMonthYearLocationModel.findOne({
    where: {
      rmyl_month: rmyl_month,
      rmyl_year: rmyl_year,
      rmyl_location_id: rmyl_location_id
    }
  });
}

async function deleteReconciliationMonthYearLocation(rmyl_month, rmyl_year, rmyl_location_id) {
  return await ReconciliationMonthYearLocationModel.destroy({
    where: {
      rmyl_month: rmyl_month,
      rmyl_year: rmyl_year,
      rmyl_location_id: rmyl_location_id
    }
  });
}

async function deleteReconciliation(month, year, location) {
  return await ReconciliationModel.destroy({
    where: {
      r_month: month,
      r_year: year,
      r_location_id: location
    }
  });
}

async function getReconciliationByMonthYearLocation(month, year, location) {
  return await ReconciliationModel.findAll({
    where: {
      r_month: month,
      r_year: year,
      r_location_id: location
    }
  });
}

async function updateReconciliationComment(r_id, r_comment) {
  return await ReconciliationModel.update(
    {
      r_comment: r_comment
    },
    {
      where: {
        r_id: r_id
      }
    }
  );
}

async function getReconciliationById(r_id) {
  return await ReconciliationModel.findOne({
    where: {
      r_id: r_id
    }
  });
}

module.exports = {
  addReconciliation,
  getReconciliationByMonthYearLocation,
  addReconciliationMonthYearLocation,
  getReconciliationMonthYearLocation,
  deleteReconciliationMonthYearLocation,
  deleteReconciliation,
  updateReconciliationComment,
  getReconciliationById
};
