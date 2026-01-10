const { QueryTypes, Op } = require('sequelize');
const { sequelize, Sequelize } = require('./db');
const TaxRelief = require('../models/taxRelief')(sequelize, Sequelize.DataTypes);

async function addTaxRelief(taxReliefData) {
  return await TaxRelief.create({
    emp_id: taxReliefData.emp_id,
    relief_type_id: taxReliefData.relief_type_id,
    amount_provided: taxReliefData.amount_provided,
    relief_amount: taxReliefData.relief_amount,
    start_date: taxReliefData.start_date,
    end_date: taxReliefData.end_date,
    document: taxReliefData.document,
    status: taxReliefData.status
  });
}

async function findAllTaxReliefs() {
  return await TaxRelief.findAll();
}

async function findTaxReliefById(id) {
  return await TaxRelief.findOne({ where: { id: id } });
}

async function findTaxReliefsByEmployee(empId) {
  return await TaxRelief.findAll({ where: { emp_id: empId } });
}

async function findActiveTaxReliefsByEmployee(empId) {
  return await TaxRelief.findAll({
    where: {
      emp_id: empId,
      status: 1
    }
  });
}

async function updateTaxRelief(taxReliefData, id) {
  return await TaxRelief.update(
    {
      emp_id: taxReliefData.emp_id,
      relief_type_id: taxReliefData.relief_type_id,
      amount_provided: taxReliefData.amount_provided,
      relief_amount: taxReliefData.relief_amount,
      start_date: taxReliefData.start_date,
      end_date: taxReliefData.end_date,
      document: taxReliefData.document,
      status: taxReliefData.status
    },
    {
      where: { id: id }
    }
  );
}

async function deleteTaxRelief(id) {
  return await TaxRelief.destroy({ where: { id: id } });
}

async function sumActiveReliefsByEmployee(empId) {
  const sum = await TaxRelief.sum('relief_amount', {
    where: {
      emp_id: empId,
      status: 1,
    }
  });
  return sum || 0;
}

/**
 * Compute tax for an employee
 * @param {number} empId - Employee ID
 * @param {number} newTaxableIncome - Taxable income after welfare deductions
 * @param {Array} taxRatesData - Tax rate bands from database
 * @returns {Object} { totalTaxAmount, taxRelief, taxObjects, tempTaxAmount }
 */
async function computeTax(empId, newTaxableIncome, taxRatesData) {
  // Get sum of active tax reliefs for employee
  const taxRelief = await sumActiveReliefsByEmployee(empId);

  let tempTaxAmount = newTaxableIncome - taxRelief;
  const TtempTaxAmount = tempTaxAmount;
  let cTax;
  let totalTaxAmount = 0;
  let i = 1;
  const taxObjects = [];

  if (parseFloat(tempTaxAmount) > 0) {
    for (const tax of taxRatesData) {
      if (i < parseInt(taxRatesData.length)) {
        if (tempTaxAmount - tax.tr_band / 12 > 0) {
          if (tempTaxAmount >= tax.tr_band / 12) {
            cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
            taxObjects.push({ band: tax.tr_band / 12, rate: tax.tr_rate, amount: cTax });
          } else {
            cTax = (tax.tr_rate / 100) * tempTaxAmount;
            totalTaxAmount = cTax + totalTaxAmount;
            taxObjects.push({ band: tax.tr_band / 12, rate: tax.tr_rate, amount: cTax });
            break;
          }
        } else {
          cTax = (tax.tr_rate / 100) * tempTaxAmount;
          totalTaxAmount = cTax + totalTaxAmount;
          taxObjects.push({ band: tax.tr_band / 12, rate: tax.tr_rate, amount: cTax });
          break;
        }
      } else {
        cTax = (tax.tr_rate / 100) * tempTaxAmount;
        taxObjects.push({ band: tax.tr_band / 12, rate: tax.tr_rate, amount: cTax });
      }
      tempTaxAmount = tempTaxAmount - tax.tr_band / 12;
      totalTaxAmount = cTax + totalTaxAmount;
      i++;
    }
  }

  return {
    totalTaxAmount,
    taxRelief,
    taxObjects,
    tempTaxAmount: TtempTaxAmount
  };
}

/**
 * old tax computation code
 *  let newTaxableIncome = empAdjustedGrossII - welfareIncomes;
 *       let checka = parseFloat(200000 / 12);
 *       let checkb = parseFloat((1 / 100) * newTaxableIncome);
 *       let allowableSum = checka;
 *       if (checkb > checka) {
 *         allowableSum = checkb;
 *       }
 *       let taxRelief = (20 / 100) * newTaxableIncome + allowableSum;
 *       let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * empAdjustedGrossII;
 *       let tempTaxAmount = newTaxableIncome - taxRelief;
 *       let TtempTaxAmount = tempTaxAmount;
 *       let cTax;
 *       let totalTaxAmount = 0;
 *       let i = 1;
 *
 *       let taxObjects = [];
 *       if (parseFloat(tempTaxAmount) > 0) {
 *         for (const tax of taxRatesData) {
 *           if (i < parseInt(taxRatesData.length)) {
 *             if (tempTaxAmount - tax.tr_band / 12 > 0) {
 *               if (tempTaxAmount >= tax.tr_band / 12) {
 *                 cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
 *                 let taxObject = {
 *                   band: tax.tr_band / 12,
 *                   rate: tax.tr_rate,
 *                   amount: cTax
 *                 };
 *                 taxObjects.push(taxObject);
 *               } else {
 *                 cTax = (tax.tr_rate / 100) * tempTaxAmount;
 *                 totalTaxAmount = cTax + totalTaxAmount;
 *                 let taxObject = {
 *                   band: tax.tr_band / 12,
 *                   rate: tax.tr_rate,
 *                   amount: cTax
 *                 };
 *                 taxObjects.push(taxObject);
 *                 break;
 *               }
 *             } else {
 *               cTax = (tax.tr_rate / 100) * tempTaxAmount;
 *               totalTaxAmount = cTax + totalTaxAmount;
 *               let taxObject = {
 *                 band: tax.tr_band / 12,
 *                 rate: tax.tr_rate,
 *                 amount: cTax
 *               };
 *               taxObjects.push(taxObject);
 *               break;
 *             }
 *           } else {
 *             cTax = (tax.tr_rate / 100) * tempTaxAmount;
 *             let taxObject = {
 *               band: tax.tr_band / 12,
 *               rate: tax.tr_rate,
 *               amount: cTax
 *             };
 *             taxObjects.push(taxObject);
 *           }
 *           tempTaxAmount = tempTaxAmount - tax.tr_band / 12;
 *
 *           totalTaxAmount = cTax + totalTaxAmount;
 *           i++;
 *         }
 *
 *         if (totalTaxAmount <= minimumTax) {
 *           totalTaxAmount = minimumTax;
 *         }
 *       } else {
 *         totalTaxAmount = minimumTax;
 *       }
 *
 *       let object = {
 *         taxable: taxableIncome,
 *         tax: totalTaxAmount,
 *         welfare: welfareIncomes,
 *         newTax: newTaxableIncome,
 *         onepercent: checkb,
 *         twohundred: checka,
 *         real: allowableSum,
 *         temptaxamount: TtempTaxAmount,
 *         newTaxableIncome: newTaxableIncome,
 *         taxRelief: taxRelief,
 *         taxObjects: taxObjects
 *       };
 *
 *       salaryObject = {
 *         salary_empid: emp.emp_id,
 *         salary_paymonth: payrollMonth,
 *         salary_payyear: payrollYear,
 *         salary_pd: paymentDefinitionTaxData.pd_id,
 *         salary_amount: totalTaxAmount,
 *         salary_share: 0,
 *         salary_tax: 1,
 *         salary_location_id: emp.emp_location_id,
 *         salary_jobrole_id: empJobRoleId,
 *         salary_department_id: empDepartmentId,
 *         salary_grade: empSalaryStructureName,
 *         salary_gross: emp.emp_gross,
 *         salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
 *         salary_emp_unique_id: emp.emp_unique_id,
 *         salary_emp_start_date: emp.emp_hire_date,
 *         salary_emp_end_date: emp.emp_contract_end_date,
 *         salary_bank_id: emp.emp_bank_id,
 *         salary_account_number: accountNumber,
 *         salary_sort_code: emp.bank.bank_code,
 *         salary_pfa: emp.emp_pension_id,
 *         salary_d7: emp.emp_d7,
 *         salary_emp_vendor_account: employeeVendorAccount
 *       };
 *
 *       let salaryAddResponse = await salary.addSalary(salaryObject);
 *
 *       if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
 *         await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
 *         return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
 *       }
 *     }
 */

module.exports = {
  addTaxRelief,
  findAllTaxReliefs,
  findTaxReliefById,
  findTaxReliefsByEmployee,
  findActiveTaxReliefsByEmployee,
  updateTaxRelief,
  deleteTaxRelief,
  sumActiveReliefsByEmployee,
  computeTax
};

