const payrollMonthYear = require('../../services/payrollMonthYearService');
const _ = require('lodash');
const payrollMonthYearLocation = require('../../services/payrollMonthYearLocationService');
const locationService = require('../../services/locationService');
const salary = require('../../services/salaryService');
const salaryCron = require('../../services/salaryCronService');

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

      if (!_.isEmpty(locationData)) {
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
  } catch (err) {
    console.log(err?.message);
  }
}

module.exports = {
  computeSalaryLocations
};
