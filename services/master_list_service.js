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
    },
    include:[{model:locationModel, as: 'location'}]
  });
}

function getMasterListFromAllLocations(month, year, sub_category) {
  return masterListModel.findAll({
    where: {
      month: month,
      year: year,
      sub_category: sub_category
    },
    include:[{model:locationModel, as: 'location'}]
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

    //1. Corper
    //2. International Staff
    //3. National Staff
    // 4.Regional
    // 5.Interns
    // 6.Consultant
    // 7.Volunteer
    // 8. Incentive Workers
    // 9.Casual Workers

    const totalEmployees = employees.length;

    const shortTerm = employees.filter((emp) => emp.emp_hire_type === 'short-term').length;
    const shortTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Corper').length;
    const shortTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const shortTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'National Staff'
    ).length;
    const shortTermAndRegional = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Regional').length;
    const shortTermAndInterns = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Interns').length;
    const shortTermAndConsultant = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Consultant').length;
    const shortTermAndVolunteer = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Volunteer').length;
    const shortTermAndIncentiveWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Incentive Workers'
    ).length;
    const shortTermAndCasualWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Casual Workers'
    ).length;

    const limtedTerm = employees.filter((emp) => emp.emp_hire_type === 'limited-term').length;
    const limitedTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Corper').length;
    const limitedTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const limitedTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'National Staff'
    ).length;
    const limitedTermAndRegional = employees.filter((emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Regional').length;
    const limitedTermAndInterns = employees.filter((emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Interns').length;
    const limitedTermAndConsultant = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Consultant'
    ).length;
    const limitedTermAndVolunteer = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Volunteer'
    ).length;
    const limitedTermAndIncentiveWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Incentive Workers'
    ).length;
    const limitedTermAndCasualWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Casual Workers'
    ).length;

    const regular = employees.filter((emp) => emp.emp_hire_type === 'regular').length;
    const regularAndCorper = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Corper').length;
    const regularAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'International Staff'
    ).length;
    const regularAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'National Staff'
    ).length;
    const regularAndRegional = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Regional').length;
    const regularAndInterns = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Interns').length;
    const regularAndConsultant = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Consultant').length;
    const regularAndVolunteer = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Volunteer').length;
    const regularAndIncentiveWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Incentive Workers'
    ).length;
    const regularAndCasualWorkers = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Casual Workers'
    ).length;

    const female = employees.filter((emp) => emp.emp_sex === 'Female').length;
    const femaleAndCorper = employees.filter((emp) => emp.emp_sex === 'Female' && emp.emp_employee_category === 'Corper').length;
    const femaleAndInternationalStaff = employees.filter(
      (emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'International Staff')
    ).length;
    const femaleAndNationalStaff = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'National Staff')).length;
    const femaleAndRegional = employees.filter((emp) => emp.emp_sex === 'Female' && emp.emp_employee_category === 'Regional').length;
    const femaleAndInterns = employees.filter((emp) => emp.emp_sex === 'Female' && emp.emp_employee_category === 'Interns').length;
    const femaleAndConsultant = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'Consultant')).length;
    const femaleAndVolunteer = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'Volunteer')).length;
    const femaleAndIncentiveWorkers = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'Incentive Workers')).length;
    const femaleAndCasualWorkers = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'Casual Workers')).length;

    const male = employees.filter((emp) => emp.emp_sex === 'Male').length;
    const maleAndCorper = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Corper').length;
    const maleAndInternationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'International Staff').length;
    const maleAndNationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'National Staff').length;
    const maleAndRegional = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Regional').length;
    const maleAndInterns = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Interns').length;
    const maleAndConsultant = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Consultant').length;
    const maleAndVolunteer = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Volunteer').length;
    const maleAndIncentiveWorkers = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Incentive Workers').length;
    const maleAndCasualWorkers = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Casual Workers').length;

    const corper = employees.filter((emp) => emp.emp_employee_category === 'Corper').length;
    const corpersEmployees = employees.filter((emp) => emp.emp_employee_category === 'Corper');
    const internationalStaff = employees.filter((emp) => emp.emp_employee_category === 'International Staff').length;
    const internationalStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'International Staff');
    const nationalStaff = employees.filter((emp) => emp.emp_employee_category === 'National Staff').length;
    const nationalStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'National Staff');
    const regional = employees.filter((emp) => emp.emp_employee_category === 'Regional').length;
    const regionalStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Regional');
    const interns = employees.filter((emp) => emp.emp_employee_category === 'Interns').length;
    const internsStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Interns');
    const consultant = employees.filter((emp) => emp.emp_employee_category === 'Consultant').length;
    const consultantStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Consultant');
    const volunteer = employees.filter((emp) => emp.emp_employee_category === 'Volunteer').length;
    const volunteerStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Volunteer');
    const incentiveWorkers = employees.filter((emp) => emp.emp_employee_category === 'Incentive Workers').length;
    const incentiveWorkersStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Incentive Workers');
    const casualWorkers = employees.filter((emp) => emp.emp_employee_category === 'Casual Workers').length;
    const casualWorkersStaffEmployees = employees.filter((emp) => emp.emp_employee_category === 'Casual Workers');

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
    const newHireAndRegional = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Regional'
    ).length;
    const newHireAndInterns = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Interns'
    ).length;
    const newHireAndConsultant = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Consultant'
    ).length;
    const newHireAndVolunteer = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Volunteer'
    ).length;
    const newHireAndIncentiveWorkers = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Incentive Workers'
    ).length;
    const newHireAndCasualWorkers = employees.filter(
      (emp) =>
        new Date(emp.emp_contract_hire_date).getMonth() === month &&
        new Date(emp.emp_contract_hire_date).getFullYear() === year &&
        emp.emp_employee_category === 'Casual Workers'
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

    let regionalStaffTotalGrossII = 0;
    let regionalStaffTotalGrossI = 0;
    let regionalStaffMainTotalDeduction = 0;
    let regionalStaffTotalEmployee = 0;
    let regionalStaffGrossSalary = 0;
    let regionalStaffNetSalary = 0;
    let regionalStaffTotalDeduction = 0;

    for (const emp of regionalStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        regionalStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              regionalStaffTotalGrossI = regionalStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              regionalStaffTotalGrossI = regionalStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              regionalStaffTotalGrossII = regionalStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              regionalStaffTotalGrossII = regionalStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            regionalStaffGrossSalary = parseFloat(empSalary.salary_amount) + regionalStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              regionalStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + regionalStaffMainTotalDeduction;
            }
            regionalStaffTotalDeduction = parseFloat(empSalary.salary_amount) + regionalStaffTotalDeduction;
          }
        }
        regionalStaffNetSalary = regionalStaffGrossSalary - regionalStaffTotalDeduction;
      }
    }

    let internsStaffTotalGrossII = 0;
    let internsStaffTotalGrossI = 0;
    let internsStaffMainTotalDeduction = 0;
    let internsStaffTotalEmployee = 0;
    let internsStaffGrossSalary = 0;
    let internsStaffNetSalary = 0;
    let internsStaffTotalDeduction = 0;

    for (const emp of internsStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        internsStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              internsStaffTotalGrossI = internsStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              internsStaffTotalGrossI = internsStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              internsStaffTotalGrossII = internsStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              internsStaffTotalGrossII = internsStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            internsStaffGrossSalary = parseFloat(empSalary.salary_amount) + internsStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              internsStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + internsStaffMainTotalDeduction;
            }
            internsStaffTotalDeduction = parseFloat(empSalary.salary_amount) + internsStaffTotalDeduction;
          }
        }
        internsStaffNetSalary = internsStaffGrossSalary - internsStaffTotalDeduction;
      }
    }

    let consultantStaffTotalGrossII = 0;
    let consultantStaffTotalGrossI = 0;
    let consultantStaffMainTotalDeduction = 0;
    let consultantStaffTotalEmployee = 0;
    let consultantStaffGrossSalary = 0;
    let consultantStaffNetSalary = 0;
    let consultantStaffTotalDeduction = 0;

    for (const emp of consultantStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        consultantStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              consultantStaffTotalGrossI = consultantStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              consultantStaffTotalGrossI = consultantStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              consultantStaffTotalGrossII = consultantStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              consultantStaffTotalGrossII = consultantStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            consultantStaffGrossSalary = parseFloat(empSalary.salary_amount) + consultantStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              consultantStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + consultantStaffMainTotalDeduction;
            }
            consultantStaffTotalDeduction = parseFloat(empSalary.salary_amount) + consultantStaffTotalDeduction;
          }
        }
        consultantStaffNetSalary = consultantStaffGrossSalary - consultantStaffTotalDeduction;
      }
    }

    let volunteerStaffTotalGrossII = 0;
    let volunteerStaffTotalGrossI = 0;
    let volunteerStaffMainTotalDeduction = 0;
    let volunteerStaffTotalEmployee = 0;
    let volunteerStaffGrossSalary = 0;
    let volunteerStaffNetSalary = 0;
    let volunteerStaffTotalDeduction = 0;

    for (const emp of volunteerStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        volunteerStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              volunteerStaffTotalGrossI = volunteerStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              volunteerStaffTotalGrossI = volunteerStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              volunteerStaffTotalGrossII = volunteerStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              volunteerStaffTotalGrossII = volunteerStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            volunteerStaffGrossSalary = parseFloat(empSalary.salary_amount) + volunteerStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              volunteerStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + volunteerStaffMainTotalDeduction;
            }
            volunteerStaffTotalDeduction = parseFloat(empSalary.salary_amount) + volunteerStaffTotalDeduction;
          }
        }
        volunteerStaffNetSalary = volunteerStaffGrossSalary - volunteerStaffTotalDeduction;
      }
    }

    let incentiveWorkersStaffTotalGrossII = 0;
    let incentiveWorkersStaffTotalGrossI = 0;
    let incentiveWorkersStaffMainTotalDeduction = 0;
    let incentiveWorkersStaffTotalEmployee = 0;
    let incentiveWorkersStaffGrossSalary = 0;
    let incentiveWorkersStaffNetSalary = 0;
    let incentiveWorkersStaffTotalDeduction = 0;

    for (const emp of incentiveWorkersStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        incentiveWorkersStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              incentiveWorkersStaffTotalGrossI = incentiveWorkersStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              incentiveWorkersStaffTotalGrossI = incentiveWorkersStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              incentiveWorkersStaffTotalGrossII = incentiveWorkersStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              incentiveWorkersStaffTotalGrossII = incentiveWorkersStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            incentiveWorkersStaffGrossSalary = parseFloat(empSalary.salary_amount) + incentiveWorkersStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              incentiveWorkersStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + incentiveWorkersStaffMainTotalDeduction;
            }
            incentiveWorkersStaffTotalDeduction = parseFloat(empSalary.salary_amount) + incentiveWorkersStaffTotalDeduction;
          }
        }
        incentiveWorkersStaffNetSalary = incentiveWorkersStaffGrossSalary - incentiveWorkersStaffTotalDeduction;
      }
    }

    let casualWorkersStaffTotalGrossII = 0;
    let casualWorkersStaffTotalGrossI = 0;
    let casualWorkersStaffMainTotalDeduction = 0;
    let casualWorkersStaffTotalEmployee = 0;
    let casualWorkersStaffGrossSalary = 0;
    let casualWorkersStaffNetSalary = 0;
    let casualWorkersStaffTotalDeduction = 0;

    for (const emp of casualWorkersStaffEmployees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);
      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        casualWorkersStaffTotalEmployee++;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_total_gross) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              casualWorkersStaffTotalGrossI = casualWorkersStaffTotalGrossI + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              casualWorkersStaffTotalGrossI = casualWorkersStaffTotalGrossI - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              casualWorkersStaffTotalGrossII = casualWorkersStaffTotalGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              casualWorkersStaffTotalGrossII = casualWorkersStaffTotalGrossII - parseFloat(empSalary.salary_amount);
            }
          }

          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            casualWorkersStaffGrossSalary = parseFloat(empSalary.salary_amount) + casualWorkersStaffGrossSalary;
          } else {
            if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
              casualWorkersStaffMainTotalDeduction = parseFloat(empSalary.salary_amount) + casualWorkersStaffMainTotalDeduction;
            }
            casualWorkersStaffTotalDeduction = parseFloat(empSalary.salary_amount) + casualWorkersStaffTotalDeduction;
          }
        }
        casualWorkersStaffNetSalary = casualWorkersStaffGrossSalary - casualWorkersStaffTotalDeduction;
      }
    }

    const corperPercentage = (corper / totalEmployees) * 100;
    const internationalStaffPercentage = (internationalStaff / totalEmployees) * 100;
    const nationalStaffPercentage = (nationalStaff / totalEmployees) * 100;
    const regionalStaffPercentage = (regional / totalEmployees) * 100;
    const internsStaffPercentage = (interns / totalEmployees) * 100;
    const consultantStaffPercentage = (consultant / totalEmployees) * 100;
    const volunteerStaffPercentage = (volunteer / totalEmployees) * 100;
    const incentiveWorkersStaffPercentage = (incentiveWorkers / totalEmployees) * 100;
    const casualWorkersStaffPercentage = (casualWorkers / totalEmployees) * 100;
    const corperPercentageCostPerSite = (corperTotalGrossII / totalGrossII) * 100;
    const internationalStaffPercentageCostPerSite = (internationalStaffTotalGrossII / totalGrossII) * 100;
    const nationalStaffPercentageCostPerSite = (nationalStaffTotalGrossII / totalGrossII) * 100;
    const regionalStaffPercentageCostPerSite = (regionalStaffTotalGrossII / totalGrossII) * 100;
    const internsStaffPercentageCostPerSite = (internsStaffTotalGrossII / totalGrossII) * 100;
    const consultantStaffPercentageCostPerSite = (consultantStaffTotalGrossII / totalGrossII) * 100;
    const volunteerStaffPercentageCostPerSite = (volunteerStaffTotalGrossII / totalGrossII) * 100;
    const incentiveWorkersStaffPercentageCostPerSite = (incentiveWorkersStaffTotalGrossII / totalGrossII) * 100;
    const casualWorkersStaffPercentageCostPerSite = (casualWorkersStaffTotalGrossII / totalGrossII) * 100;

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

    const regionalStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndRegional,
      limited_term: limitedTermAndRegional,
      short_term: shortTermAndRegional,
      male: maleAndRegional,
      female: femaleAndRegional,
      total: regional,
      percentage_workforce: regionalStaffPercentage.toFixed(2),
      cost_per_site: regionalStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: regionalStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndRegional,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 4
    };

    const consultantStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndConsultant,
      limited_term: limitedTermAndConsultant,
      short_term: shortTermAndConsultant,
      male: maleAndConsultant,
      female: femaleAndConsultant,
      total: consultant,
      percentage_workforce: consultantStaffPercentage.toFixed(2),
      cost_per_site: consultantStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: consultantStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndConsultant,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 5
    };

    const internsStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndInterns,
      limited_term: limitedTermAndInterns,
      short_term: shortTermAndInterns,
      male: maleAndInterns,
      female: femaleAndInterns,
      total: interns,
      percentage_workforce: internsStaffPercentage.toFixed(2),
      cost_per_site: internsStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: internsStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndInterns,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 6
    };

    const volunteerStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndVolunteer,
      limited_term: limitedTermAndVolunteer,
      short_term: shortTermAndVolunteer,
      male: maleAndVolunteer,
      female: femaleAndVolunteer,
      total: volunteer,
      percentage_workforce: volunteerStaffPercentage.toFixed(2),
      cost_per_site: volunteerStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: volunteerStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndVolunteer,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 7
    };

    const incentiveWorkersStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndIncentiveWorkers,
      limited_term: limitedTermAndIncentiveWorkers,
      short_term: shortTermAndIncentiveWorkers,
      male: maleAndIncentiveWorkers,
      female: femaleAndIncentiveWorkers,
      total: incentiveWorkers,
      percentage_workforce: incentiveWorkersStaffPercentage.toFixed(2),
      cost_per_site: incentiveWorkersStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: incentiveWorkersStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndIncentiveWorkers,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 8
    };

    const casualWorkersStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndCasualWorkers,
      limited_term: limitedTermAndCasualWorkers,
      short_term: shortTermAndCasualWorkers,
      male: maleAndCasualWorkers,
      female: femaleAndCasualWorkers,
      total: casualWorkers,
      percentage_workforce: casualWorkersStaffPercentage.toFixed(2),
      cost_per_site: casualWorkersStaffTotalGrossII.toFixed(2),
      percentage_cost_per_site: casualWorkersStaffPercentageCostPerSite.toFixed(2),
      new_hire: newHireAndCasualWorkers,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 9
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
      updateOrCreateMasterList(regionalStaffMasterList),
      updateOrCreateMasterList(consultantStaffMasterList),
      updateOrCreateMasterList(internsStaffMasterList),
      updateOrCreateMasterList(volunteerStaffMasterList),
      updateOrCreateMasterList(incentiveWorkersStaffMasterList),
      updateOrCreateMasterList(casualWorkersStaffMasterList),
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
  getMasterList,
  getMasterListFromAllLocations
};
