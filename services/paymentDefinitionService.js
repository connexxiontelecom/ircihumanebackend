const { QueryTypes, Op } = require('sequelize');
const { sequelize, Sequelize } = require('./db');
const Pd = require('../models/paymentdefinition')(sequelize, Sequelize.DataTypes);

const helper = require('../helper');

async function addPaymentDefinition(pd) {
  return await Pd.create({
    pd_payment_code: pd.pd_payment_code,
    pd_payment_name: pd.pd_payment_name,
    pd_payment_type: pd.pd_payment_type,
    pd_payment_variant: pd.pd_payment_variant,
    pd_payment_taxable: pd.pd_payment_taxable,
    pd_desc: pd.pd_desc,
    pd_basic: pd.pd_basic,
    pd_tie_number: pd.pd_tie_number,
    pd_pr_gross: pd.pd_pr_gross,
    pd_amount: pd.pd_amount,
    pd_value: pd.pd_value,
    pd_percentage: pd.pd_percentage,
    pd_tax: pd.pd_tax,
    pd_total_gross: pd.pd_total_gross,
    pd_total_gross_ii: pd.pd_total_gross_ii,
    pd_welfare: pd.pd_welfare,
    pd_employee: pd.pd_employee
  });
}

async function findPaymentByCode(code) {
  return await Pd.findOne({ where: { pd_payment_code: code } });
}

async function findPaymentById(id) {
  return await Pd.findOne({ where: { pd_id: id } });
}

async function updatePaymentDefinition(pd, pd_id) {
  return await Pd.update(
    {
      pd_payment_code: pd.pd_payment_code,
      pd_payment_name: pd.pd_payment_name,
      pd_payment_type: pd.pd_payment_type,
      pd_payment_variant: pd.pd_payment_variant,
      pd_payment_taxable: pd.pd_payment_taxable,
      pd_desc: pd.pd_desc,
      pd_basic: pd.pd_basic,
      pd_tie_number: pd.pd_tie_number,
      pd_pr_gross: pd.pd_pr_gross,
      pd_amount: pd.pd_amount,
      pd_value: pd.pd_value,
      pd_percentage: pd.pd_percentage,
      pd_tax: pd.pd_tax,
      pd_total_gross: pd.pd_total_gross,
      pd_total_gross_ii: pd.pd_total_gross_ii,
      pd_welfare: pd.pd_welfare,
      pd_employee: pd.pd_employee
    },
    {
      where: {
        pd_id: pd_id
      }
    }
  );
}

async function findBasicPaymentDefinition() {
  return await Pd.findOne({
    where: {
      pd_basic: 1
    }
  });
}

async function findAllCodes() {
  return await Pd.findAll();
}

async function findAllEmployeeCodes() {
  return await Pd.findAll({ where: { pd_employee: 1 } });
}

async function findAllEmployerCodes() {
  return await Pd.findAll({ where: { pd_employer: 2 } });
}

async function getVariationalPayments() {
  return await Pd.findAll({ where: { pd_payment_variant: 2 } });
}

async function findSumPercentage() {
  return await Pd.sum('pd_pr_gross');
}

async function findCodeWithGross() {
  return await Pd.findAll({
    where: {
      pd_pr_gross: {
        [Op.ne]: 0
      }
    }
  });
}

async function findTax() {
  return await Pd.findOne({
    where: {
      pd_tax: 1
    }
  });
}

async function getComputedPayments() {
  return await Pd.findAll({
    where: {
      pd_value: 2
    }
  });
}
async function getCustomComputedPayments() {
  return await Pd.findAll({
    where: {
      pd_value: 3
    }
  });
}

async function getWelfare() {
  return await Pd.findAll({
    where: {
      pd_welfare: 1
    }
  });
}

async function getPensionPayments() {
  return await Pd.findAll({
    where: {
      pd_pension: 1
    }
  });
}

async function getNhfPayments() {
  return await Pd.findAll({
    where: {
      pd_nhf: 1
    }
  });
}

async function getNsitfPayments() {
  return await Pd.findAll({
    where: {
      pd_nsitf: 1
    }
  });
}

async function getSeverancePayments() {
  return await Pd.findAll({
    where: {
      pd_id: 39
    }
  });
}

async function getTaxPayments() {
  return await Pd.findAll({
    where: {
      pd_tax: 1
    }
  });
}

async function deletePayment(pdId) {
  return await Pd.destroy({
    where: {
      pd_id: pdId
    }
  });
}

async function getPayrollJournalPayments() {
  return await Pd.findAll({
    where: {
      pd_payroll_journal: 1
    }
  });
}

module.exports = {
  addPaymentDefinition,
  findPaymentByCode,
  findPaymentById,
  findAllCodes,
  findAllEmployerCodes,
  findAllEmployeeCodes,
  updatePaymentDefinition,
  findSumPercentage,
  findCodeWithGross,
  findBasicPaymentDefinition,
  getVariationalPayments,
  findTax,
  getComputedPayments,
  getWelfare,
  getPensionPayments,
  getNhfPayments,
  deletePayment,
  getTaxPayments,
  getNsitfPayments,
  getPayrollJournalPayments,
  getSeverancePayments,
  getCustomComputedPayments
};
