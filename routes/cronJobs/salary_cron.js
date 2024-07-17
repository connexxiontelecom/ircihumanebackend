const payrollMonthYear = require('../../services/payrollMonthYearService');
const _ = require('lodash');
const payrollMonthYearLocation = require('../../services/payrollMonthYearLocationService');
const locationService = require('../../services/locationService');
const salary = require('../../services/salaryService');
const salaryCron = require('../../services/salaryCronService');
const logs = require('../../services/logService');
const employee = require('../../services/employeeService');
const salaryStructure = require('../../services/salaryStructureService');

async function computeSalaryLocations() {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      console.log(`No payroll month and year set`);
      return;
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    //check if payroll routine has been run

    let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
      console.log(`Payroll Routine has not been run for any location`);
      return;
    }

    let payrollLocations = await payrollMonthYearLocation.findPendingPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
      console.log(`No Pending Payroll Routine for any location`);
      return;
    }

    for (const location of payrollLocations) {
      const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);

      if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
        console.log(`Salary Cron already exists for location ${location.pmyl_location_id}`);
        continue;
      }
      const locationData = await locationService.findLocationById(location.pmyl_location_id);

      if (_.isEmpty(locationData)) {
        console.log(`No location found for location id ${location.pmyl_location_id}`);
        continue;
      }
      const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);

      if (_.isEmpty(employees) || _.isNull(employees)) {
        console.log(`No employees found for location ${locationData?.location_name} - ${locationData?.location_t6_code}`);
        continue;
      }

      let locationTotalGross = 0;
      let locationTotalGrossII = 0;
      let locationTotalGrossI = 0;
      let locationTotalDeduction = 0;
      let locationTotalNetPay = 0;
      let locationTotalEmployee = 0;
      let grossSalary = 0;
      let netSalary = 0;
      let totalDeduction = 0;

      for (const emp of employees) {
        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.salary_empid);
        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          locationTotalEmployee++;

          for (const empSalary of employeeSalaries) {
            if (parseInt(empSalary.payment.pd_total_gross) === 1) {
              if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                locationTotalGrossI = locationTotalGrossI + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                locationTotalGrossI = locationTotalGrossI - parseFloat(empSalary.salary_amount);
              }
            }

            if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
              if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                locationTotalGrossII = locationTotalGrossII + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                locationTotalGrossII = locationTotalGrossII - parseFloat(empSalary.salary_amount);
              }
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              if (parseInt(empSalary.payment.pd_employee) === 1) {
                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
              }
              // grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
            } else {
              totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
            }
          }
          netSalary = grossSalary - totalDeduction;
        }
      }

      locationTotalNetPay = locationTotalNetPay + netSalary;
      locationTotalGross = locationTotalGrossII + locationTotalGross;
      locationTotalDeduction = totalDeduction + locationTotalDeduction;

      let locationSalaryObject = {
        sc_location_id: locationData.location_id,
        sc_location_name: locationData.location_name,
        sc_location_code: locationData.location_t6_code,
        sc_gross: locationTotalGross,
        sc_total_deduction: locationTotalDeduction,
        sc_net: locationTotalNetPay,
        sc_employee_count: locationTotalEmployee,
        sc_month: payrollMonth,
        sc_year: payrollYear
      };

      await salaryCron.addSalaryCron(locationSalaryObject);
    }
    await logs.addLog({
      log_user_id: 1,
      log_description: 'Computed Salary Locations',
      log_date: new Date()
    });
  } catch (err) {
    console.log(err?.message);
  }
}

async function syncSalaryStructure() {
  const locations = await locationService.findAllLocations();
  for (const location of locations) {
    const locationId = location.location_id;
    const employees = await employee.getActiveEmployeesByLocation(locationId);
    if (employees?.length === 0) {
      console.log(`No active employees found for location ${location.location_name}`);
      continue;
    }
    for (const employee of employees) {
      const grossSalary = parseFloat(employee?.emp_gross);
      const empId = employee?.emp_id;
      if (grossSalary === 0) {
        console.log(`No gross salary found for employee ${employee.emp_id} - ${employee.emp_name}`);
        continue;
      }
      const empSalaryStructure = await salaryStructure.findSalaryStructure(empId);
      const salaryGrade = empSalaryStructure?.ss_grade;
      await salaryStructure.deleteSalaryStructuresEmployee(empId);

      await Promise.all([
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 1,
          ss_amount: grossSalary,
          ss_grade: salaryGrade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 2,
          ss_amount: 100000,
          ss_grade: salaryGrade
        }),
        salaryStructure.addSalaryStructure({
          ss_empid: empId,
          ss_pd: 3,
          ss_amount: 100000,
          ss_grade: salaryGrade
        })
      ]);
    }
  }
}

module.exports = {
  computeSalaryLocations,
  syncSalaryStructure
};
