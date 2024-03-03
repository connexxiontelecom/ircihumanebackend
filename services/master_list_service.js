const { QueryTypes, Op } = require('sequelize');
const Joi = require('joi');

const { sequelize, Sequelize } = require('./db');
const masterListModel = require('../models/master-list')(sequelize, Sequelize.DataTypes);
const employeeModel = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const locationModel = require('../models/Location')(sequelize, Sequelize.DataTypes);

const { format, subDays } = require('date-fns');
const salary = require('./salaryService');
const _ = require('lodash');

function getMasterList(month, year, location_id, sub_category) {
  return masterListModel.findAll({
    where: {
      month: month,
      year: year,
      location_id: location_id,
      sub_category: sub_category
    }
  });
}

async function generateMasterList() {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const todaysDate = new Date();
  const allLocations = await locationModel.findAll();
  for (const location of allLocations) {
    const locationId = location.location_id;
    const employees = await employeeModel.findAll({
      where: {
        emp_location_id: locationId,
        emp_contract_end_date: {
          [Op.gte]: todaysDate
        }
      }
    });

    const totalEmployees = employees.length;

    const shortTerm = employees.filter((emp) => emp.emp_hire_type === 'short-term').length;
    const shortTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Corper').length;
    const shortTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const shortTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'National Staff'
    ).length;

    const limtedTerm = employees.filter((emp) => emp.emp_hire_type === 'limited-term').length;
    const limitedTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Corper').length;
    const limitedTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const limitedTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'National Staff'
    ).length;

    const regular = employees.filter((emp) => emp.emp_hire_type === 'regular').length;
    const regularAndCorper = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Corper').length;
    const regularAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'International Staff'
    ).length;
    const regularAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'National Staff'
    ).length;

    const female = employees.filter((emp) => emp.emp_sex === 'Female').length;
    const femaleAndCorper = employees.filter((emp) => emp.emp_sex === 'Female' && emp.emp_employee_category === 'Corper').length;
    const femaleAndInternationalStaff = employees.filter(
      (emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'International Staff')
    ).length;
    const femaleAndNationalStaff = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'National Staff')).length;

    const male = employees.filter((emp) => emp.emp_sex === 'Male').length;
    const maleAndCorper = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Corper').length;
    const maleAndInternationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'International Staff').length;
    const maleAndNationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'National Staff').length;

    const corper = employees.filter((emp) => emp.emp_employee_category === 'Corper').length;
    const corpersEmployees = employees.filter((emp) => emp.emp_employee_category === 'Corper');
    const internationalStaff = employees.filter((emp) => emp.emp_employee_category === 'International Staff').length;
    const internationalStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'International Staff');
    const nationalStaff = employees.filter((emp) => emp.emp_employee_category === 'National Staff').length;
    const nationalStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'National Staff');

    const newHire = employees.filter(
      (emp) => new Date(emp.emp_contract_hire_date).getMonth() === month && new Date(emp.emp_contract_hire_date).getFullYear() === year
    ).length;
    const newHireAndCorper = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Corper'
    ).length;
    const newHireAndInternationalStaff = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'International Staff'
    ).length;
    const newHireAndNationalStaff = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'National Staff'
    ).length;

    let totalGrossII = 0;
    let totalGrossI = 0;
    let mainTotalDeduction = 0;
    let locationTotalEmployee = 0;
    let grossSalary = 0;
    let netSalary = 0;
    let totalDeduction = 0;

    for (const emp of employees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        locationTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              totalGrossI = totalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              totalGrossI = totalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              totalGrossII = totalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              totalGrossII = totalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              mainTotalDeduction = parseFloat(empSalary.salary_amount) + mainTotalDeduction;
            }
            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
          }
        }
        netSalary = grossSalary - totalDeduction;
      }
    }

    let corperTotalGrossII = 0;
    let corperTotalGrossI = 0;
    let corperMainTotalDeduction = 0;
    let corperTotalEmployee = 0;
    let corperGrossSalary = 0;
    let corperNetSalary = 0;
    let corperTotalDeduction = 0;

    for (const emp of corpersEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        corperTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              corperTotalGrossI = corperTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              corperTotalGrossI = corperTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              corperTotalGrossII = corperTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              corperTotalGrossII = corperTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            corperGrossSalary = parseFloat(empSalary.salary_amount) + corperGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              corperMainTotalDeduction = parseFloat(empSalary.salary_amount) + corperMainTotalDeduction;
            }
            corperTotalDeduction = parseFloat(empSalary.salary_amount) + corperTotalDeduction;
          }
        }
        corperNetSalary = corperGrossSalary - corperTotalDeduction;
      }
    }

    let internationalStaffTotalGrossII = 0;
    let internationalStaffTotalGrossI = 0;
    let internationalStaffMainTotalDeduction = 0;
    let internationalStaffTotalEmployee = 0;
    let internationalStaffGrossSalary = 0;
    let internationalStaffNetSalary = 0;
    let internationalStaffTotalDeduction = 0;

    for (const emp of internationalStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        internationalStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              internationalStaffTotalGrossI = internationalStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              internationalStaffTotalGrossI = internationalStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              internationalStaffTotalGrossII = internationalStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              internationalStaffTotalGrossII = internationalStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            internationalStaffGrossSalary = parseFloat(empSalary.salary_amount) + internationalStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              internationalStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + internationalStaffMainTotalDeduction;
            }
            internationalStaffTotalDeduction = parseFloat(empSalary.salary_amount) + internationalStaffTotalDeduction;
          }
        }
        internationalStaffNetSalary = internationalStaffGrossSalary - internationalStaffTotalDeduction;
      }
    }

    let nationalStaffTotalGrossII = 0;
    let nationalStaffTotalGrossI = 0;
    let nationalStaffMainTotalDeduction = 0;
    let nationalStaffTotalEmployee = 0;
    let nationalStaffGrossSalary = 0;
    let nationalStaffNetSalary = 0;
    let nationalStaffTotalDeduction = 0;

    for (const emp of nationalStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        nationalStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              nationalStaffTotalGrossI = nationalStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              nationalStaffTotalGrossI = nationalStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              nationalStaffTotalGrossII = nationalStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              nationalStaffTotalGrossII = nationalStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            nationalStaffGrossSalary = parseFloat(empSalary.salary_amount) + nationalStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              nationalStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + nationalStaffMainTotalDeduction;
            }
            nationalStaffTotalDeduction = parseFloat(empSalary.salary_amount) + nationalStaffTotalDeduction;
          }
        }
        nationalStaffNetSalary = nationalStaffGrossSalary - nationalStaffTotalDeduction;
      }
    }

    const corperPercentage = (corper / totalEmployees) * 100;
    const internationalStaffPercentage = (internationalStaff / totalEmployees) * 100;
    const nationalStaffPercentage = (nationalStaff / totalEmployees) * 100;
    const corperPercentageCostPerSite = (corperTotalGrossII / totalGrossII) * 100;
    const internationalStaffPercentageCostPerSite = (internationalStaffTotalGrossII / totalGrossII) * 100;
    const nationalStaffPercentageCostPerSite = (nationalStaffTotalGrossII / totalGrossII) * 100;

    const corperMasterList = {
      location_id: locationId,
      regular_term: regularAndCorper,
      limited_term: limitedTermAndCorper,
      short_term: shortTermAndCorper,
      male: maleAndCorper,
      female: femaleAndCorper,
      total: corper,
      percentage_workforce: corperPercentage.toFixed(2),
      cost_per_site: corperTotalGrossII.toFixed(2),
      percentage_cost_per_site: corperPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndCorper,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 1
    };

    const internationalStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndInternationalStaff,
      limited_term: limitedTermAndInternationalStaff,
      short_term: shortTermAndInternationalStaff,
      male: maleAndInternationalStaff,
      female: femaleAndInternationalStaff,
      total: internationalStaff,
      percentage_workforce: internationalStaffPercentage.toFixed(2),
      cost_per_site: internationalStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: internationalStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndInternationalStaff,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 2
    };

    const nationalStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndNationalStaff,
      limited_term: limitedTermAndNationalStaff,
      short_term: shortTermAndNationalStaff,
      male: maleAndNationalStaff,
      female: femaleAndNationalStaff,
      total: nationalStaff,
      percentage_workforce: nationalStaffPercentage.toFixed(2),
      cost_per_site: nationalStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: nationalStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndNationalStaff,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 3
    };

    const masterList = {
      location_id: locationId,
      regular_term: regular,
      limited_term: limtedTerm,
      short_term: shortTerm,
      male: male,
      female: female,
      total: totalEmployees,
      percentage_workforce: 100,
      cost_per_site: totalGrossII.toFixed(2),
      percentage_cost_per_site: 100,
      new_hire: newHire,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 0
    };

    await Promise.all([
      updateOrCreateMasterList(corperMasterList),
      updateOrCreateMasterList(internationalStaffMasterList),
      updateOrCreateMasterList(nationalStaffMasterList),
      updateOrCreateMasterList(masterList)
    ]);
  }
}

async function updateOrCreateMasterList(masterListData) {
  const { month, year, sub_category, location_id } = masterListData;
  const existingMasterList = await masterListModel.findOne({
    where: {
      month,
      year,
      sub_category,
      location_id
    }
  });

  if (existingMasterList) {
    await masterListModel.update(masterListData, {
      where: {
        id: existingMasterList.id
      }
    });
  } else {
    await masterListModel.create(masterListData);
  }
}

module.exports = {
  generateMasterList,
  getMasterList
};
