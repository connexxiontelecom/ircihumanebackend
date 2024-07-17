const Joi = require('joi');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays');
const isWeekend = require('date-fns/isWeekend');
const differenceInMonths = require('date-fns/differenceInMonths');
const differenceInCalendarMonths = require('date-fns/differenceInCalendarMonths');
const salaryStructure = require('../services/salaryStructureService');
const paymentDefinition = require('../services/paymentDefinitionService');
const employee = require('../services/employeeService');
const user = require('../services/userService');
const locationAllowance = require('../services/locationAllowanceService');
const locationService = require('../services/locationService');
const salary = require('../services/salaryService');
const variationalPayment = require('../services/variationalPaymentService');
const payrollMonthYear = require('../services/payrollMonthYearService');
const payrollMonthYearLocation = require('../services/payrollMonthYearLocationService');
const taxRates = require('../services/taxRateService');
const minimumTaxRate = require('../services/minimumTaxRateService');
const departmentService = require('../services/departmentService');
const jobRoleService = require('../services/jobRoleService');
const mailer = require('../services/IRCMailer');
const ROLES = require('../roles');
const pensionService = require('../services/pensionProivderService');
const severancePayService = require('../services/severancePayService');
const { addLeaveAccrual, computeLeaveAccruals, removeLeaveAccrual, removeLeaveAccrualEmployees } = require('../routes/leaveAccrual');
const leaveTypeService = require('../services/leaveTypeService');
const logs = require('../services/logService');
const { getTimeSheetDayEntry } = require('../services/timeSheetService');
const { businessDaysDifference } = require('../services/dateService');
const pauseSalaryService = require('../services/pauseSalaryService');
const reconciliationService = require('../services/reconciliationService');
const salaryCron = require('../services/salaryCronService');

/* run salary routine */
router.get('/salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      let salaryObject = {};

      // check for pending variational payments
      const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)) {
        //check if payroll routine has been run
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
          const employees = await employee.getActiveEmployees();
          let GrossArray = [];

          for (const emp of employees) {
            let empGross = parseFloat(emp.emp_gross);

            let hiredDate = new Date(emp.emp_hire_date);
            let contractEndDate = new Date(emp.emp_contract_end_date);

            const contractEndYear = contractEndDate.getFullYear();
            const contractEndMonth = contractEndDate.getMonth() + 1;

            const hireYear = hiredDate.getFullYear();
            const hireMonth = hiredDate.getMonth() + 1;

            const payrollDate = new Date(parseInt(payrollYear), parseInt(payrollMonth) - 1, 2);
            let daysBeforeStart;
            if (hireYear === parseInt(payrollYear) && hireMonth === parseInt(payrollMonth)) {
              daysBeforeStart = await differenceInBusinessDays(hiredDate, payrollDate);
              empGross = empGross - (daysBeforeStart + 1) * (empGross / 22);
            }

            if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
              let suspendEmployee = await employee.suspendEmployee(emp.emp_id, 'Contract Ended');
              let suspendUser = await user.suspendUser(emp.emp_unique_id);

              daysBeforeStart = await differenceInBusinessDays(contractEndDate, payrollDate);
              daysBeforeStart = 22 - (daysBeforeStart + 1);
              empGross = empGross - daysBeforeStart * (empGross / 22);
            }

            if (empGross > 0) {
              //check employee variational payments
              const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(
                emp.emp_id,
                payrollMonth,
                payrollYear
              );

              if (!(_.isEmpty(employeeVariationalPayments) || _.isNull(employeeVariationalPayments))) {
                for (const empVP of employeeVariationalPayments) {
                  salaryObject = {
                    salary_empid: emp.emp_id,
                    salary_paymonth: payrollMonth,
                    salary_payyear: payrollYear,
                    salary_pd: empVP.vp_payment_def_id,
                    salary_amount: empVP.vp_amount,
                    salary_share: 0,
                    salary_tax: 0
                  };

                  let salaryAddResponse = await salary.addSalary(salaryObject);

                  if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`An error Occurred while Processing Routine variational payments `);
                  }
                }
              }

              const grossPercentage = await paymentDefinition.findCodeWithGross();
              if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
                await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                return res.status(400).json(`Update Payment Definitions to include Gross Percentage`);
              } else {
                const totalPercentageGross = await paymentDefinition.findSumPercentage();

                if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
                  await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                  return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`);
                } else {
                  let amount = 0;
                  let percent = 0;

                  let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition();
                  let basicSalaryPercent = parseFloat(paymentDefinitionData.pd_pr_gross);

                  //  splitting into percentages

                  for (const percentage of grossPercentage) {
                    percent = parseFloat(percentage.pd_pr_gross);
                    amount = (percent / 100) * empGross;

                    salaryObject = {
                      salary_empid: emp.emp_id,
                      salary_paymonth: payrollMonth,
                      salary_payyear: payrollYear,
                      salary_pd: percentage.pd_id,
                      salary_amount: amount,
                      salary_share: percent,
                      salary_tax: 0
                    };

                    let salaryAddResponse = await salary.addSalary(salaryObject);

                    if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                      await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                      return res.status(400).json(`An error Occurred while Processing Routine splitting gross `);
                    }
                  }

                  // hazard allowances
                  const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(emp.emp_location_id);

                  if (!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)) {
                    for (const allowance of hazardAllowances) {
                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: allowance.la_payment_id,
                        salary_amount: allowance.la_amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine hazard allowance `);
                      }
                    }
                  }

                  //computational Payments

                  const computationalPayments = await paymentDefinition.getComputedPayments();

                  let fullGross = 0;
                  let empAdjustedGross = 0;
                  let empAdjustedGrossII = 0;

                  let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

                  for (const salary of fullSalaryData) {
                    if (parseInt(salary.payment.pd_payment_type) === 1) {
                      fullGross = parseFloat(salary.salary_amount) + fullGross;
                    }

                    if (parseInt(salary.payment.pd_total_gross) === 1) {
                      if (parseInt(salary.payment.pd_payment_type) === 1) {
                        empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
                      }

                      if (parseInt(salary.payment.pd_payment_type) === 2) {
                        empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
                      }
                    }

                    if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
                      if (parseInt(salary.payment.pd_payment_type) === 1) {
                        empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
                      }

                      if (parseInt(salary.payment.pd_payment_type) === 2) {
                        empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
                      }
                    }
                  }

                  let basicFullGross = (basicSalaryPercent / 100) * fullGross;

                  let basicAdjustedGross = (basicSalaryPercent / 100) * empAdjustedGross;

                  for (const computationalPayment of computationalPayments) {
                    //adjusted gross computation
                    if (parseInt(computationalPayment.pd_amount) === 1) {
                      amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGross;

                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: computationalPayment.pd_id,
                        salary_amount: amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
                      }
                    }

                    //adjusted gross basic computation
                    if (parseInt(computationalPayment.pd_amount) === 2) {
                      amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicAdjustedGross;

                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: computationalPayment.pd_id,
                        salary_amount: amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine basic computation `);
                      }
                    }

                    // Full Gross
                    if (parseInt(computationalPayment.pd_amount) === 3) {
                      amount = (parseFloat(computationalPayment.pd_percentage) / 100) * fullGross;

                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: computationalPayment.pd_id,
                        salary_amount: amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
                      }
                    }

                    // Full basic Gross
                    if (parseInt(computationalPayment.pd_amount) === 4) {
                      amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicFullGross;

                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: computationalPayment.pd_id,
                        salary_amount: amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
                      }
                    }

                    //adjusted gross II
                    if (parseInt(computationalPayment.pd_amount) === 5) {
                      amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGrossII;

                      salaryObject = {
                        salary_empid: emp.emp_id,
                        salary_paymonth: payrollMonth,
                        salary_payyear: payrollYear,
                        salary_pd: computationalPayment.pd_id,
                        salary_amount: amount,
                        salary_share: 0,
                        salary_tax: 0
                      };

                      let salaryAddResponse = await salary.addSalary(salaryObject);

                      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                        return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
                      }
                    }
                  }

                  //tax computation
                  let welfareIncomes = 0;
                  let taxableIncome = 0;
                  let taxableIncomeData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

                  for (const income of taxableIncomeData) {
                    if (parseInt(income.payment.pd_payment_type) === 1 && parseInt(income.payment.pd_payment_taxable) === 1) {
                      taxableIncome = parseFloat(income.salary_amount) + taxableIncome;
                    }

                    if (parseInt(income.payment.pd_welfare) === 1) {
                      welfareIncomes = welfareIncomes + parseFloat(income.salary_amount);
                    }
                  }

                  let taxRatesData = await taxRates.findAllTaxRate();

                  if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`No tax Rate Setup`);
                  }
                  let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate();
                  if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`Minimum Tax Rate Not Setup `);
                  }

                  let paymentDefinitionTaxData = await paymentDefinition.findTax();

                  if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`No Payment Definition has been Indicated as Tax `);
                  }
                  let newTaxableIncome = empAdjustedGrossII - welfareIncomes;
                  let checka = parseFloat(200000 / 12);
                  let checkb = parseFloat((1 / 100) * empAdjustedGrossII);
                  let allowableSum = checka;
                  if (checkb > checka) {
                    allowableSum = checkb;
                  }
                  let taxRelief = (20 / 100) * empAdjustedGrossII + allowableSum;
                  let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * empAdjustedGrossII;
                  let tempTaxAmount = newTaxableIncome - taxRelief;
                  let TtempTaxAmount = tempTaxAmount;
                  let cTax;
                  let totalTaxAmount = 0;
                  let i = 1;

                  let taxObjects = [];
                  if (parseFloat(tempTaxAmount) > 0) {
                    for (const tax of taxRatesData) {
                      if (i < parseInt(taxRatesData.length)) {
                        if (tempTaxAmount - tax.tr_band / 12 > 0) {
                          if (tempTaxAmount >= tax.tr_band / 12) {
                            cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
                            let taxObject = {
                              band: tax.tr_band / 12,
                              rate: tax.tr_rate,
                              amount: cTax
                            };
                            taxObjects.push(taxObject);
                          } else {
                            cTax = (tax.tr_rate / 100) * tempTaxAmount;
                            totalTaxAmount = cTax + totalTaxAmount;
                            let taxObject = {
                              band: tax.tr_band / 12,
                              rate: tax.tr_rate,
                              amount: cTax
                            };
                            taxObjects.push(taxObject);
                            break;
                          }
                        } else {
                          cTax = (tax.tr_rate / 100) * tempTaxAmount;
                          totalTaxAmount = cTax + totalTaxAmount;
                          let taxObject = {
                            band: tax.tr_band / 12,
                            rate: tax.tr_rate,
                            amount: cTax
                          };
                          taxObjects.push(taxObject);
                          break;
                        }
                      } else {
                        cTax = (tax.tr_rate / 100) * tempTaxAmount;
                        let taxObject = {
                          band: tax.tr_band / 12,
                          rate: tax.tr_rate,
                          amount: cTax
                        };
                        taxObjects.push(taxObject);
                      }
                      tempTaxAmount = tempTaxAmount - tax.tr_band / 12;

                      totalTaxAmount = cTax + totalTaxAmount;
                      i++;
                    }

                    if (totalTaxAmount <= minimumTax) {
                      totalTaxAmount = minimumTax;
                    }
                  } else {
                    totalTaxAmount = minimumTax;
                  }

                  let object = {
                    taxable: taxableIncome,
                    tax: totalTaxAmount,
                    welfare: welfareIncomes,
                    newTax: newTaxableIncome,
                    onepercent: checkb,
                    twohundred: checka,
                    real: allowableSum,
                    temptaxamount: TtempTaxAmount,
                    newTaxableIncome: newTaxableIncome,
                    taxRelief: taxRelief,
                    taxObjects: taxObjects
                  };

                  salaryObject = {
                    salary_empid: emp.emp_id,
                    salary_paymonth: payrollMonth,
                    salary_payyear: payrollYear,
                    salary_pd: paymentDefinitionTaxData.pd_id,
                    salary_amount: totalTaxAmount,
                    salary_share: 0,
                    salary_tax: 1
                  };

                  let salaryAddResponse = await salary.addSalary(salaryObject);

                  if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
                  }

                  const leaveTypesData = await leaveTypeService.getAccruableLeaves();

                  if (_.isNull(leaveTypesData) || _.isEmpty(leaveTypesData)) {
                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                    return res.status(400).json(`An error Occurred while Processing No Leave type to accrue for Employees `);
                  }

                  for (const leaveType of leaveTypesData) {
                    const leaveAccrual = {
                      lea_emp_id: emp.emp_id,
                      lea_month: payrollMonth,
                      lea_year: payrollYear,
                      lea_leave_type: leaveType.leave_type_id,
                      lea_rate: parseFloat(leaveType.lt_rate)
                    };

                    const addAccrualResponse = await addLeaveAccrual(leaveAccrual);

                    if (_.isEmpty(addAccrualResponse) || _.isNull(addAccrualResponse)) {
                      await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
                      return res.status(400).json(`An error Occurred while Processing Leave Accruing Error `);
                    }
                  }

                  let grossObject = {
                    empGross,
                    empAdjustedGross
                  };

                  GrossArray.push(grossObject);
                }
              }
            }
          }

          //return  res.status(200).json(GrossArray)
          const logData = {
            log_user_id: req.user.username.user_id,
            log_description: 'Ran Payroll Routine',
            log_date: new Date()
          };
          await logs.addLog(logData);
          return res.status(200).json('Action Successful');
        } else {
          return res.status(400).json(`Payroll Routine has already been run`);
        }
      } else {
        return res.status(400).json(`There are pending Variational Payments`);
      }
    }
  } catch (err) {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();

    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;

    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

/* run salary routine location */
router.post('/salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    const employeeIdsLocation = [];
    let salaryObject = {};

    const employees = await employee.getActiveEmployeesByLocation(pmylLocationId);

    if (_.isEmpty(employees)) {
      return res.status(400).json('No Employees in Selected Location');
    }

    for (const emp of employees) {
      const checkForSalaryPause = await pauseSalaryService.findExistingPauseSalary(emp.emp_id, payrollMonth, payrollYear);
      if (!_.isNull(checkForSalaryPause) || !_.isEmpty(checkForSalaryPause)) {
        continue;
      }
      employeeIdsLocation.push(emp.emp_id);
    }

    // check for pending variational payments
    const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYearEmployees(
      payrollMonth,
      payrollYear,
      employeeIdsLocation
    );
    if (pendingVariationalPayment?.length > 0) {
      return res.status(400).json(`There are pending Variational Payments`);
    }
    //check if payroll routine has been run
    const salaryRoutineCheck = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
    if (!_.isNull(salaryRoutineCheck) || !_.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has already been run for selected location`);
    }

    let GrossArray = [];

    for (const emp of employees) {
      // syncronise employee data
      await employee.updateContractStartDate(emp.emp_id, emp.emp_hire_date);

      const checkForSalaryPause = await pauseSalaryService.findExistingPauseSalary(emp.emp_id, payrollMonth, payrollYear);
      if (!_.isNull(checkForSalaryPause) || !_.isEmpty(checkForSalaryPause)) {
        continue;
      }
      let accountNumber = emp.emp_account_no;
      let employeeVendorAccount = emp.emp_vendor_account;
      let letter = accountNumber.charAt(1);
      if (letter !== "'") {
        accountNumber = `'${accountNumber}`;
      }

      let empDepartmentId = 0;
      if (!(_.isEmpty(emp.emp_department_id) || _.isNull(emp.emp_department_id))) {
        empDepartmentId = parseInt(emp.emp_department_id);
      }

      let empJobRoleId = 0;
      if (!(_.isEmpty(emp.emp_job_role_id) || _.isNull(emp.emp_job_role_id))) {
        empJobRoleId = parseInt(emp.emp_job_role_id);
      }

      let empSalaryStructureName = 'N/A';
      let costOfLivingAllowance = 0;
      let empSalaryStructure = await salaryStructure.findEmployeeSalaryStructure(emp.emp_id);
      if (!_.isEmpty(empSalaryStructure)) {
        if (!_.isNull(empSalaryStructure.salary_grade) || !_.isEmpty(empSalaryStructure.salary_grade)) {
          empSalaryStructureName = empSalaryStructure.salary_grade.sg_name;
          costOfLivingAllowance = empSalaryStructure.salary_grade.sg_col_allowance;
        }
      }

      let empGross = parseFloat(emp.emp_gross);

      const immutableEmpGross = parseFloat(emp.emp_gross);

      let hiredDate = new Date(emp.emp_hire_date);

      let contractEndDate = new Date(emp.emp_contract_end_date);

      const diffenceInMonthsFromHireDateToToday = differenceInCalendarMonths(new Date(), hiredDate);

      const contractEndYear = contractEndDate.getFullYear();
      const contractEndMonth = contractEndDate.getMonth() + 1;

      const hireYear = hiredDate.getFullYear();
      const hireMonth = hiredDate.getMonth() + 1;

      let lastDayOfMonth = new Date(parseInt(payrollYear), parseInt(payrollMonth), 0);
      const lastDayOfMonthDD = String(lastDayOfMonth.getDate()).padStart(2, '0');
      const lastDayOfMonthMM = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'); //January is 0!
      const lastDayOfMonthYYYY = lastDayOfMonth.getFullYear();

      const formatLastDayOfMonth = lastDayOfMonthDD + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthYYYY;

      const formatLastDayOfMonthReverse = lastDayOfMonthYYYY + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthDD;

      const payrollDate = new Date(formatLastDayOfMonthReverse);
      let checkDate = lastDayOfMonthYYYY + '-' + lastDayOfMonthMM + '-' + '1';

      let daysBeforeStart = 0;
      let checkFirstDateWeekend = true;
      let checkSecondDateWeekend = true;
      if (hireYear === parseInt(payrollYear) && hireMonth === parseInt(payrollMonth)) {
        let hireDay = String(hiredDate.getDate()).padStart(2, '0');
        if (parseInt(hireDay) > 1) {
          checkSecondDateWeekend = await isWeekend(hiredDate);
          daysBeforeStart = await businessDaysDifference(emp.emp_hire_date, checkDate);
          if (!checkSecondDateWeekend) {
            daysBeforeStart--;
          }
          empGross = empGross - daysBeforeStart * (empGross / 22);
        }
      }

      if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
        await employee.suspendEmployee(emp.emp_id, 'Contract Ended');

        const contractEndDateDD = String(contractEndDate.getDate()).padStart(2, '0');
        const contractEndDateMM = String(contractEndDate.getMonth() + 1).padStart(2, '0'); //January is 0!
        const contractEndDateYYYY = contractEndDate.getFullYear();

        const formatContractEndDate = contractEndDateDD + '-' + contractEndDateMM + '-' + contractEndDateYYYY;
        const reverseFormatContractEndDate = contractEndDateYYYY + '-' + contractEndDateMM + '-' + contractEndDateDD;

        if (formatContractEndDate !== formatLastDayOfMonth) {
          daysBeforeStart = await businessDaysDifference(formatLastDayOfMonthReverse, reverseFormatContractEndDate);
          if (!isWeekend(contractEndDate)) {
            daysBeforeStart--;
          }

          empGross = empGross - daysBeforeStart * (empGross / 22);
        }
      }

      if (empGross <= 0) {
        continue;
      }

      //check employee variational payments
      const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(emp.emp_id, payrollMonth, payrollYear);
      if (!(_.isEmpty(employeeVariationalPayments) || _.isNull(employeeVariationalPayments))) {
        for (const empVP of employeeVariationalPayments) {
          salaryObject = {
            salary_empid: emp.emp_id,
            salary_paymonth: payrollMonth,
            salary_payyear: payrollYear,
            salary_pd: empVP.vp_payment_def_id,
            salary_amount: empVP.vp_amount,
            salary_share: 0,
            salary_tax: 0,
            salary_location_id: emp.emp_location_id,
            salary_jobrole_id: empJobRoleId,
            salary_department_id: empDepartmentId,
            salary_grade: empSalaryStructureName,
            salary_gross: emp.emp_gross,
            salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
            salary_emp_unique_id: emp.emp_unique_id,
            salary_emp_start_date: emp.emp_hire_date,
            salary_emp_end_date: emp.emp_contract_end_date,
            salary_bank_id: emp.emp_bank_id,
            salary_account_number: accountNumber,
            salary_sort_code: emp.bank.bank_code,
            salary_pfa: emp.emp_pension_id,
            salary_d7: emp.emp_d7,
            salary_emp_vendor_account: employeeVendorAccount
          };

          let salaryAddResponse = await salary.addSalary(salaryObject);

          if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
            await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
            return res.status(400).json(`An error Occurred while Processing Routine variational payments `);
          }
        }
      }

      const grossPercentage = await paymentDefinition.findCodeWithGross();
      if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`Update Payment Definitions to include Gross Percentage`);
      }
      const totalPercentageGross = await paymentDefinition.findSumPercentage();

      if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`);
      }

      let amount = 0;
      let percent = 0;

      let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition();
      let basicSalaryPercent = parseFloat(paymentDefinitionData.pd_pr_gross);

      const [response1, response2, response3] = await Promise.all([
        salary.addSalary({
          salary_empid: emp.emp_id,
          salary_paymonth: payrollMonth,
          salary_payyear: payrollYear,
          salary_pd: 1,
          salary_amount: immutableEmpGross,
          salary_share: 100,
          salary_tax: 0,
          salary_location_id: emp.emp_location_id,
          salary_jobrole_id: empJobRoleId,
          salary_department_id: empDepartmentId,
          salary_grade: empSalaryStructureName,
          salary_gross: emp.emp_gross,
          salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
          salary_emp_unique_id: emp.emp_unique_id,
          salary_emp_start_date: emp.emp_hire_date,
          salary_emp_end_date: emp.emp_contract_end_date,
          salary_bank_id: emp.emp_bank_id,
          salary_account_number: accountNumber,
          salary_sort_code: emp.bank.bank_code,
          salary_pfa: emp.emp_pension_id,
          salary_d7: emp.emp_d7,
          salary_emp_vendor_account: employeeVendorAccount
        }),
        salary.addSalary({
          salary_empid: emp.emp_id,
          salary_paymonth: payrollMonth,
          salary_payyear: payrollYear,
          salary_pd: 2,
          salary_amount: 100000,
          salary_share: 0,
          salary_tax: 0,
          salary_location_id: emp.emp_location_id,
          salary_jobrole_id: empJobRoleId,
          salary_department_id: empDepartmentId,
          salary_grade: empSalaryStructureName,
          salary_gross: emp.emp_gross,
          salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
          salary_emp_unique_id: emp.emp_unique_id,
          salary_emp_start_date: emp.emp_hire_date,
          salary_emp_end_date: emp.emp_contract_end_date,
          salary_bank_id: emp.emp_bank_id,
          salary_account_number: accountNumber,
          salary_sort_code: emp.bank.bank_code,
          salary_pfa: emp.emp_pension_id,
          salary_d7: emp.emp_d7,
          salary_emp_vendor_account: employeeVendorAccount
        }),
        salary.addSalary({
          salary_empid: emp.emp_id,
          salary_paymonth: payrollMonth,
          salary_payyear: payrollYear,
          salary_pd: 2,
          salary_amount: 100000,
          salary_share: 0,
          salary_tax: 0,
          salary_location_id: emp.emp_location_id,
          salary_jobrole_id: empJobRoleId,
          salary_department_id: empDepartmentId,
          salary_grade: empSalaryStructureName,
          salary_gross: emp.emp_gross,
          salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
          salary_emp_unique_id: emp.emp_unique_id,
          salary_emp_start_date: emp.emp_hire_date,
          salary_emp_end_date: emp.emp_contract_end_date,
          salary_bank_id: emp.emp_bank_id,
          salary_account_number: accountNumber,
          salary_sort_code: emp.bank.bank_code,
          salary_pfa: emp.emp_pension_id,
          salary_d7: emp.emp_d7,
          salary_emp_vendor_account: employeeVendorAccount
        })
      ]);

      const emptyResponse = _.isEmpty(response1) || _.isEmpty(response2) || _.isEmpty(response3);
      const nullResponse = _.isNull(response1) || _.isNull(response2) || _.isNull(response3);

      if (emptyResponse || nullResponse) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`An error Occurred while Processing Routine splitting gross `);
      }

      // hazard allowances
      const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(emp.emp_location_id);
      if (!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)) {
        for (const allowance of hazardAllowances) {
          salaryObject = {
            salary_empid: emp.emp_id,
            salary_paymonth: payrollMonth,
            salary_payyear: payrollYear,
            salary_pd: allowance.la_payment_id,
            salary_amount: allowance.la_amount,
            salary_share: 0,
            salary_tax: 0,
            salary_location_id: emp.emp_location_id,
            salary_jobrole_id: empJobRoleId,
            salary_department_id: empDepartmentId,
            salary_grade: empSalaryStructureName,
            salary_gross: emp.emp_gross,
            salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
            salary_emp_unique_id: emp.emp_unique_id,
            salary_emp_start_date: emp.emp_hire_date,
            salary_emp_end_date: emp.emp_contract_end_date,
            salary_bank_id: emp.emp_bank_id,
            salary_account_number: accountNumber,
            salary_sort_code: emp.bank.bank_code,
            salary_pfa: emp.emp_pension_id,
            salary_d7: emp.emp_d7,
            salary_emp_vendor_account: employeeVendorAccount
          };

          let salaryAddResponse = await salary.addSalary(salaryObject);
          if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
            await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
            return res.status(400).json(`An error Occurred while Processing Routine hazard allowance `);
          }
        }
      }

      //computational Payments

      const customComputationalPayments = await paymentDefinition.getCustomComputedPayments();
      for (const customComputationalPayment of customComputationalPayments) {
        if (parseInt(customComputationalPayment.pd_id) === 40) {
          amount = (parseFloat(costOfLivingAllowance) / 100) * empGross;
          salaryObject = {
            salary_empid: emp.emp_id,
            salary_paymonth: payrollMonth,
            salary_payyear: payrollYear,
            salary_pd: customComputationalPayment.pd_id,
            salary_amount: amount,
            salary_share: 0,
            salary_tax: 0,
            salary_location_id: emp.emp_location_id,
            salary_jobrole_id: empJobRoleId,
            salary_department_id: empDepartmentId,
            salary_grade: empSalaryStructureName,
            salary_gross: emp.emp_gross,
            salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
            salary_emp_unique_id: emp.emp_unique_id,
            salary_emp_start_date: emp.emp_hire_date,
            salary_emp_end_date: emp.emp_contract_end_date,
            salary_bank_id: emp.emp_bank_id,
            salary_account_number: accountNumber,
            salary_sort_code: emp.bank.bank_code,
            salary_pfa: emp.emp_pension_id,
            salary_d7: emp.emp_d7,
            salary_emp_vendor_account: employeeVendorAccount
          };

          let salaryAddResponse = await salary.addSalary(salaryObject);

          if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
            await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
            return res.status(400).json(`An error Occurred while Processing cost of living computation `);
          }
        }
      }

      const computationalPayments = await paymentDefinition.getComputedPayments();

      let fullGross = 0;
      let empAdjustedGross = 0;
      let empAdjustedGrossII = 0;

      let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      for (const salary of fullSalaryData) {
        if (parseInt(salary.payment.pd_payment_type) === 1) {
          fullGross = parseFloat(salary.salary_amount) + fullGross;
        }

        if (parseInt(salary.payment.pd_total_gross) === 1) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
          }

          if (parseInt(salary.payment.pd_payment_type) === 2) {
            empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
          }
        }

        if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
          }

          if (parseInt(salary.payment.pd_payment_type) === 2) {
            empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
          }
        }
      }

      let basicFullGross = (basicSalaryPercent / 100) * fullGross;

      let basicAdjustedGross = (basicSalaryPercent / 100) * empAdjustedGross;

      for (const computationalPayment of computationalPayments) {
        if (parseInt(computationalPayment.pd_id) !== 39) {
          //adjusted gross computation
          if (parseInt(computationalPayment.pd_amount) === 1) {
            // TODO: update this to use correct Id
            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGross;

            salaryObject = {
              salary_empid: emp.emp_id,
              salary_paymonth: payrollMonth,
              salary_payyear: payrollYear,
              salary_pd: computationalPayment.pd_id,
              salary_amount: amount,
              salary_share: 0,
              salary_tax: 0,
              salary_location_id: emp.emp_location_id,
              salary_jobrole_id: empJobRoleId,
              salary_department_id: empDepartmentId,
              salary_grade: empSalaryStructureName,
              salary_gross: emp.emp_gross,
              salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
              salary_emp_unique_id: emp.emp_unique_id,
              salary_emp_start_date: emp.emp_hire_date,
              salary_emp_end_date: emp.emp_contract_end_date,
              salary_bank_id: emp.emp_bank_id,
              salary_account_number: accountNumber,
              salary_sort_code: emp.bank.bank_code,
              salary_pfa: emp.emp_pension_id,
              salary_d7: emp.emp_d7,
              salary_emp_vendor_account: employeeVendorAccount
            };

            let salaryAddResponse = await salary.addSalary(salaryObject);

            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
              await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
              return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
            }
          }

          //adjusted gross basic computation
          if (parseInt(computationalPayment.pd_amount) === 2) {
            if (parseInt(computationalPayment.pd_id) !== 7) {
              amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicAdjustedGross;

              salaryObject = {
                salary_empid: emp.emp_id,
                salary_paymonth: payrollMonth,
                salary_payyear: payrollYear,
                salary_pd: computationalPayment.pd_id,
                salary_amount: amount,
                salary_share: 0,
                salary_tax: 0,
                salary_location_id: emp.emp_location_id,
                salary_jobrole_id: empJobRoleId,
                salary_department_id: empDepartmentId,
                salary_grade: empSalaryStructureName,
                salary_gross: emp.emp_gross,
                salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
                salary_emp_unique_id: emp.emp_unique_id,
                salary_emp_start_date: emp.emp_hire_date,
                salary_emp_end_date: emp.emp_contract_end_date,
                salary_bank_id: emp.emp_bank_id,
                salary_account_number: accountNumber,
                salary_sort_code: emp.bank.bank_code,
                salary_pfa: emp.emp_pension_id,
                salary_d7: emp.emp_d7,
                salary_emp_vendor_account: employeeVendorAccount
              };

              let salaryAddResponse = await salary.addSalary(salaryObject);

              if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
                return res.status(400).json(`An error Occurred while Processing Routine basic computation `);
              }
            }

            if (parseInt(computationalPayment.pd_id) === 7 && emp.emp_nhf_status) {
              amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicAdjustedGross;

              salaryObject = {
                salary_empid: emp.emp_id,
                salary_paymonth: payrollMonth,
                salary_payyear: payrollYear,
                salary_pd: computationalPayment.pd_id,
                salary_amount: amount,
                salary_share: 0,
                salary_tax: 0,
                salary_location_id: emp.emp_location_id,
                salary_jobrole_id: empJobRoleId,
                salary_department_id: empDepartmentId,
                salary_grade: empSalaryStructureName,
                salary_gross: emp.emp_gross,
                salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
                salary_emp_unique_id: emp.emp_unique_id,
                salary_emp_start_date: emp.emp_hire_date,
                salary_emp_end_date: emp.emp_contract_end_date,
                salary_bank_id: emp.emp_bank_id,
                salary_account_number: accountNumber,
                salary_sort_code: emp.bank.bank_code,
                salary_pfa: emp.emp_pension_id,
                salary_d7: emp.emp_d7,
                salary_emp_vendor_account: employeeVendorAccount
              };

              let salaryAddResponse = await salary.addSalary(salaryObject);

              if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
                return res.status(400).json(`An error Occurred while Processing Routine basic computation `);
              }
            }
          }

          // Full Gross
          if (parseInt(computationalPayment.pd_amount) === 3) {
            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * fullGross;

            salaryObject = {
              salary_empid: emp.emp_id,
              salary_paymonth: payrollMonth,
              salary_payyear: payrollYear,
              salary_pd: computationalPayment.pd_id,
              salary_amount: amount,
              salary_share: 0,
              salary_tax: 0,
              salary_location_id: emp.emp_location_id,
              salary_jobrole_id: empJobRoleId,
              salary_department_id: empDepartmentId,
              salary_grade: empSalaryStructureName,
              salary_gross: emp.emp_gross,
              salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
              salary_emp_unique_id: emp.emp_unique_id,
              salary_emp_start_date: emp.emp_hire_date,
              salary_emp_end_date: emp.emp_contract_end_date,
              salary_bank_id: emp.emp_bank_id,
              salary_account_number: accountNumber,
              salary_sort_code: emp.bank.bank_code,
              salary_pfa: emp.emp_pension_id,
              salary_d7: emp.emp_d7,
              salary_emp_vendor_account: employeeVendorAccount
            };

            let salaryAddResponse = await salary.addSalary(salaryObject);

            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
              await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
              return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
            }
          }

          // Full basic Gross
          if (parseInt(computationalPayment.pd_amount) === 4) {
            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicFullGross;

            salaryObject = {
              salary_empid: emp.emp_id,
              salary_paymonth: payrollMonth,
              salary_payyear: payrollYear,
              salary_pd: computationalPayment.pd_id,
              salary_amount: amount,
              salary_share: 0,
              salary_tax: 0,
              salary_location_id: emp.emp_location_id,
              salary_jobrole_id: empJobRoleId,
              salary_department_id: empDepartmentId,
              salary_grade: empSalaryStructureName,
              salary_gross: emp.emp_gross,
              salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
              salary_emp_unique_id: emp.emp_unique_id,
              salary_emp_start_date: emp.emp_hire_date,
              salary_emp_end_date: emp.emp_contract_end_date,
              salary_bank_id: emp.emp_bank_id,
              salary_account_number: accountNumber,
              salary_sort_code: emp.bank.bank_code,
              salary_pfa: emp.emp_pension_id,
              salary_d7: emp.emp_d7,
              salary_emp_vendor_account: employeeVendorAccount
            };

            let salaryAddResponse = await salary.addSalary(salaryObject);

            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
              await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
              return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
            }
          }

          //adjusted gross II
          if (parseInt(computationalPayment.pd_amount) === 5) {
            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGrossII;

            salaryObject = {
              salary_empid: emp.emp_id,
              salary_paymonth: payrollMonth,
              salary_payyear: payrollYear,
              salary_pd: computationalPayment.pd_id,
              salary_amount: amount,
              salary_share: 0,
              salary_tax: 0,
              salary_location_id: emp.emp_location_id,
              salary_jobrole_id: empJobRoleId,
              salary_department_id: empDepartmentId,
              salary_grade: empSalaryStructureName,
              salary_gross: emp.emp_gross,
              salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
              salary_emp_unique_id: emp.emp_unique_id,
              salary_emp_start_date: emp.emp_hire_date,
              salary_emp_end_date: emp.emp_contract_end_date,
              salary_bank_id: emp.emp_bank_id,
              salary_account_number: accountNumber,
              salary_sort_code: emp.bank.bank_code,
              salary_pfa: emp.emp_pension_id,
              salary_d7: emp.emp_d7,
              salary_emp_vendor_account: employeeVendorAccount
            };

            let salaryAddResponse = await salary.addSalary(salaryObject);

            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
              await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
              return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
            }
          }
        }

        if (parseInt(computationalPayment.pd_id) === 39 && diffenceInMonthsFromHireDateToToday > 11) {
          amount = (parseFloat(computationalPayment.pd_percentage) / 100) * immutableEmpGross;

          salaryObject = {
            salary_empid: emp.emp_id,
            salary_paymonth: payrollMonth,
            salary_payyear: payrollYear,
            salary_pd: computationalPayment.pd_id,
            salary_amount: amount,
            salary_share: 0,
            salary_tax: 0,
            salary_location_id: emp.emp_location_id,
            salary_jobrole_id: empJobRoleId,
            salary_department_id: empDepartmentId,
            salary_grade: empSalaryStructureName,
            salary_gross: emp.emp_gross,
            salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
            salary_emp_unique_id: emp.emp_unique_id,
            salary_emp_start_date: emp.emp_hire_date,
            salary_emp_end_date: emp.emp_contract_end_date,
            salary_bank_id: emp.emp_bank_id,
            salary_account_number: accountNumber,
            salary_sort_code: emp.bank.bank_code,
            salary_pfa: emp.emp_pension_id,
            salary_d7: emp.emp_d7,
            salary_emp_vendor_account: employeeVendorAccount
          };
          let salaryAddResponse = await salary.addSalary(salaryObject);

          if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
            await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
            return res.status(400).json(`An error Occurred while Processing severance pay computation `);
          }
          const addSeverancePay = await severancePayService.addSeverancePay({
            sp_empid: emp.emp_id,
            sp_d7: emp.emp_d7,
            sp_t7: emp.emp_unique_id,
            sp_amount: amount,
            sp_month: payrollMonth,
            sp_year: payrollYear,
            sp_created_by: req.user.username.user_id,
            sp_location_id: pmylLocationId
          });
          if (_.isEmpty(addSeverancePay) || _.isNull(addSeverancePay)) {
            await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
            return res.status(400).json(`An error Occurred while severance pay computation `);
          }
        }
      }

      //tax computation
      let welfareIncomes = 0;
      let taxableIncome = 0;
      let taxableIncomeData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      for (const income of taxableIncomeData) {
        if (parseInt(income.payment.pd_payment_type) === 1 && parseInt(income.payment.pd_payment_taxable) === 1) {
          taxableIncome = parseFloat(income.salary_amount) + taxableIncome;
        }

        if (parseInt(income.payment.pd_welfare) === 1) {
          welfareIncomes = welfareIncomes + parseFloat(income.salary_amount);
        }
      }

      let taxRatesData = await taxRates.findAllTaxRate();
      if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`No tax Rate Setup `);
      }
      let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate();
      if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`Minimum Tax Rate Not Setup `);
      }

      let paymentDefinitionTaxData = await paymentDefinition.findTax();

      if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`No Payment Definition has been Indicated as Tax `);
      }
      let newTaxableIncome = empAdjustedGrossII - welfareIncomes;
      let checka = parseFloat(200000 / 12);
      let checkb = parseFloat((1 / 100) * newTaxableIncome);
      let allowableSum = checka;
      if (checkb > checka) {
        allowableSum = checkb;
      }
      let taxRelief = (20 / 100) * newTaxableIncome + allowableSum;
      let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * empAdjustedGrossII;
      let tempTaxAmount = newTaxableIncome - taxRelief;
      let TtempTaxAmount = tempTaxAmount;
      let cTax;
      let totalTaxAmount = 0;
      let i = 1;

      let taxObjects = [];
      if (parseFloat(tempTaxAmount) > 0) {
        for (const tax of taxRatesData) {
          if (i < parseInt(taxRatesData.length)) {
            if (tempTaxAmount - tax.tr_band / 12 > 0) {
              if (tempTaxAmount >= tax.tr_band / 12) {
                cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
                let taxObject = {
                  band: tax.tr_band / 12,
                  rate: tax.tr_rate,
                  amount: cTax
                };
                taxObjects.push(taxObject);
              } else {
                cTax = (tax.tr_rate / 100) * tempTaxAmount;
                totalTaxAmount = cTax + totalTaxAmount;
                let taxObject = {
                  band: tax.tr_band / 12,
                  rate: tax.tr_rate,
                  amount: cTax
                };
                taxObjects.push(taxObject);
                break;
              }
            } else {
              cTax = (tax.tr_rate / 100) * tempTaxAmount;
              totalTaxAmount = cTax + totalTaxAmount;
              let taxObject = {
                band: tax.tr_band / 12,
                rate: tax.tr_rate,
                amount: cTax
              };
              taxObjects.push(taxObject);
              break;
            }
          } else {
            cTax = (tax.tr_rate / 100) * tempTaxAmount;
            let taxObject = {
              band: tax.tr_band / 12,
              rate: tax.tr_rate,
              amount: cTax
            };
            taxObjects.push(taxObject);
          }
          tempTaxAmount = tempTaxAmount - tax.tr_band / 12;

          totalTaxAmount = cTax + totalTaxAmount;
          i++;
        }

        if (totalTaxAmount <= minimumTax) {
          totalTaxAmount = minimumTax;
        }
      } else {
        totalTaxAmount = minimumTax;
      }

      let object = {
        taxable: taxableIncome,
        tax: totalTaxAmount,
        welfare: welfareIncomes,
        newTax: newTaxableIncome,
        onepercent: checkb,
        twohundred: checka,
        real: allowableSum,
        temptaxamount: TtempTaxAmount,
        newTaxableIncome: newTaxableIncome,
        taxRelief: taxRelief,
        taxObjects: taxObjects
      };

      salaryObject = {
        salary_empid: emp.emp_id,
        salary_paymonth: payrollMonth,
        salary_payyear: payrollYear,
        salary_pd: paymentDefinitionTaxData.pd_id,
        salary_amount: totalTaxAmount,
        salary_share: 0,
        salary_tax: 1,
        salary_location_id: emp.emp_location_id,
        salary_jobrole_id: empJobRoleId,
        salary_department_id: empDepartmentId,
        salary_grade: empSalaryStructureName,
        salary_gross: emp.emp_gross,
        salary_emp_name: `${emp.emp_first_name} ${emp.emp_last_name}`,
        salary_emp_unique_id: emp.emp_unique_id,
        salary_emp_start_date: emp.emp_hire_date,
        salary_emp_end_date: emp.emp_contract_end_date,
        salary_bank_id: emp.emp_bank_id,
        salary_account_number: accountNumber,
        salary_sort_code: emp.bank.bank_code,
        salary_pfa: emp.emp_pension_id,
        salary_d7: emp.emp_d7,
        salary_emp_vendor_account: employeeVendorAccount
      };

      let salaryAddResponse = await salary.addSalary(salaryObject);

      if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
        await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
        return res.status(400).json(`An error Occurred while Processing Routine gross computation `);
      }
    }

    const pmylObject = {
      pmyl_month: payrollMonth,
      pmyl_year: payrollYear,
      pmyl_location_id: pmylLocationId
    };

    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: 'Ran Payroll Routine',
      log_date: new Date()
    };

    await Promise.all([
      payrollMonthYearLocation.addPayrollMonthYearLocation(pmylObject),
      salaryCron.deleteSalaryCron(payrollMonth, payrollYear, pmylLocationId),
      logs.addLog(logData)
    ]);

    return res.status(200).json('Action Successful');
  } catch (err) {
    const payrollRequest = req.body;
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/salary-routine-test', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    const employeeIdsLocation = [];
    let salaryObject = {};

    const employees = await employee.getActiveEmployeesByLocation(pmylLocationId);

    if (_.isEmpty(employees)) {
      return res.status(400).json('No Employees in Selected Location');
    }

    for (const emp of employees) {
      employeeIdsLocation.push(emp.emp_id);
    }

    // check for pending variational payments
    const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYearEmployees(
      payrollMonth,
      payrollYear,
      employeeIdsLocation
    );

    if (_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)) {
      //check if payroll routine has been run
      const salaryRoutineCheck = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);

      if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
        let GrossArray = [];

        for (const emp of employees) {
          let empDepartmentId = 0;
          if (!(_.isEmpty(emp.emp_department_id) || _.isNull(emp.emp_department_id))) {
            empDepartmentId = parseInt(emp.emp_department_id);
          }

          let empJobRoleId = 0;
          if (!(_.isEmpty(emp.emp_job_role_id) || _.isNull(emp.emp_job_role_id))) {
            empJobRoleId = parseInt(emp.emp_job_role_id);
          }

          let empSalaryStructureName = 'N/A';
          let empSalaryStructure = await salaryStructure.findEmployeeSalaryStructure(emp.emp_id);

          if (!_.isEmpty(empSalaryStructure)) {
            if (!_.isNull(empSalaryStructure.salary_grade) || !_.isEmpty(empSalaryStructure.salary_grade)) {
              empSalaryStructureName = empSalaryStructure.salary_grade.sg_name;
            }
          }

          let empGross = parseFloat(emp.emp_gross);

          let hiredDate = new Date(emp.emp_hire_date);

          let contractEndDate = new Date(emp.emp_contract_end_date);

          const contractEndYear = contractEndDate.getFullYear();
          const contractEndMonth = contractEndDate.getMonth() + 1;

          const hireYear = hiredDate.getFullYear();
          const hireMonth = hiredDate.getMonth() + 1;

          let lastDayOfMonth = new Date(parseInt(payrollYear), parseInt(payrollMonth), 0);
          const lastDayOfMonthDD = String(lastDayOfMonth.getDate()).padStart(2, '0');
          const lastDayOfMonthMM = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'); //January is 0!
          const lastDayOfMonthYYYY = lastDayOfMonth.getFullYear();

          const formatLastDayOfMonth = lastDayOfMonthDD + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthYYYY;

          const formatLastDayOfMonthReverse = lastDayOfMonthYYYY + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthDD;
          const payrollDate = new Date(formatLastDayOfMonthReverse);

          let daysBeforeStart = 0;
          let checkFirstDateWeekend = true;
          let checkSecondDateWeekend = true;
          if (hireYear === parseInt(payrollYear) && hireMonth === parseInt(payrollMonth)) {
            let hireDay = String(hiredDate.getDate()).padStart(2, '0');
            if (parseInt(hireDay) > 1) {
              checkSecondDateWeekend = await isWeekend(hiredDate);
              daysBeforeStart = await differenceInBusinessDays(hiredDate, checkDate);
              daysBeforeStart = daysBeforeStart - 1;
              if (!checkSecondDateWeekend) {
                daysBeforeStart++;
              }
              empGross = empGross - daysBeforeStart * (empGross / 22);
            }
          }

          if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
            const contractEndDateDD = String(contractEndDate.getDate()).padStart(2, '0');
            const contractEndDateMM = String(contractEndDate.getMonth() + 1).padStart(2, '0'); //January is 0!
            const contractEndDateYYYY = contractEndDate.getFullYear();

            const formatContractEndDate = contractEndDateDD + '-' + contractEndDateMM + '-' + contractEndDateYYYY;

            if (formatContractEndDate !== formatLastDayOfMonth) {
              checkFirstDateWeekend = await isWeekend(payrollDate);
              checkSecondDateWeekend = await isWeekend(contractEndDate);
              daysBeforeStart = await differenceInBusinessDays(payrollDate, contractEndDate);
              daysBeforeStart = daysBeforeStart - 1;
              if (!checkFirstDateWeekend) {
                daysBeforeStart++;
              }
              // if(!checkSecondDateWeekend){
              //     daysBeforeStart++
              // }

              empGross = empGross - daysBeforeStart * (empGross / 22);
            }
          }
          let salaryObject = {
            name: emp.emp_first_name,
            gross: empGross,
            contractEndDate: contractEndDate,
            payrollDate: payrollDate,
            days: daysBeforeStart,
            payrollDateStatus: checkFirstDateWeekend,
            contractDate: checkSecondDateWeekend
          };

          GrossArray.push(salaryObject);
        }

        return res.status(200).json(GrossArray);
      } else {
        return res.status(400).json(`Payroll Routine has already been run for selected location`);
      }
    } else {
      return res.status(400).json(`There are pending Variational Payments`);
    }
  } catch (err) {
    const payrollRequest = req.body;
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    await salary.undoSalaryMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

/* check payroll routine */
router.get('/check-salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

      if (!(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck))) {
        return res.status(400).json(`Payroll Routine has already been run`);
      } else {
        return res.status(200).json(`Payroll Routine has not been run`);
      }
    }
  } catch (err) {
    console.log(err?.message);
    next(err);
  }
});

/* undo salary */
router.get('/undo-salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();

    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;

    await salary.undoSalaryMonthYear(payrollMonth, payrollYear);

    const reverseVariationalPayments = await variationalPayment.undoVariationalPaymentMonthYear(payrollMonth, payrollYear);

    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: 'Undo Payroll Routine',
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json('Action Successful');
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/undo-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();

    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    const employeeIdsLocation = [];
    if (parseInt(pmylLocationId) > 0) {
      await payrollMonthYearLocation.removePayrollMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);

      const empSalaries = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, pmylLocationId);

      for (const emp of empSalaries) {
        let tempEmp = await employee.getEmployee(emp.salary_empid);

        if (!_.isEmpty(tempEmp)) {
          let contractEndDate = new Date(tempEmp.emp_contract_end_date);

          const contractEndYear = contractEndDate.getFullYear();
          const contractEndMonth = contractEndDate.getMonth() + 1;

          if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
            await employee.unSuspendEmployee(emp.salary_empid);

            await user.unSuspendUser(tempEmp.emp_unique_id);
          }

          employeeIdsLocation.push(emp.salary_empid);
        }
      }
    } else {
      await payrollMonthYearLocation.removePayrollMonthYear(payrollMonth, payrollYear);
      const empSalaries = await salary.getDistinctEmployeesMonthYear(payrollMonth, payrollYear);

      for (const emp of empSalaries) {
        let tempEmp = await employee.getEmployee(emp.salary_empid);

        if (!_.isEmpty(tempEmp)) {
          let contractEndDate = new Date(tempEmp.emp_contract_end_date);

          const contractEndYear = contractEndDate.getFullYear();
          const contractEndMonth = contractEndDate.getMonth() + 1;

          if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
            await employee.unSuspendEmployee(emp.salary_empid);

            await user.unSuspendUser(tempEmp.emp_unique_id);
          }

          employeeIdsLocation.push(emp.salary_empid);
        }
      }
    }

    await Promise.all([
      salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation),
      reconciliationService.deleteReconciliation(payrollMonth, payrollYear, pmylLocationId),
      salaryCron.deleteSalaryCron(payrollMonth, payrollYear, pmylLocationId),
      reconciliationService.deleteReconciliationMonthYearLocation(payrollMonth, payrollYear, pmylLocationId),
      variationalPayment.undoVariationalPaymentMonthYearEmployee(payrollMonth, payrollYear, employeeIdsLocation)
    ]);
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: 'Undo Payroll Routine',
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json('Action Successful');
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

/* fetch salary */
router.get('/pull-salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run
      let employeeSalary = [];
      const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

      if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
        return res.status(400).json(`Payroll Routine has not been run`);
      } else {
        const employees = await employee.getActiveEmployees();

        for (const emp of employees) {
          let grossSalary = 0;
          let netSalary = 0;
          let totalDeduction = 0;

          let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);
          if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
            for (const empSalary of employeeSalaries) {
              if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
              } else {
                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              }
            }
            netSalary = grossSalary - totalDeduction;
            let empJobRole = 'N/A';
            // if(parseInt(emp.emp_job_role_id) > 0){
            //     empJobRole = emp.jobRole.job_role
            // }

            let sectorName = 'N/A';
            if (parseInt(emp.emp_department_id) > 0) {
              sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`;
            }

            let salaryObject = {
              employeeId: emp.emp_id,
              employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
              employeeUniqueId: emp.emp_unique_id,
              location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
              jobRole: empJobRole,
              sector: sectorName,
              grossSalary: grossSalary,
              totalDeduction: totalDeduction,
              netSalary: netSalary
            };

            employeeSalary.push(salaryObject);
          }
        }
        return res.status(200).json(employeeSalary);
      }
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

/* fetch salary */
router.get('/pull-salary-routine-locations', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run

      let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
        return res.status(400).json(`Payroll Routine has not been run for any location`);
      }

      let payrollLocations = await payrollMonthYearLocation.findPendingPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
        return res.status(400).json(`No pending payroll run`);
      }

      let locationSalaryArray = [];
      for (const location of payrollLocations) {
        const locationData = await locationService.findLocationById(location.pmyl_location_id);

        const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);
        if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
          locationSalaryArray.push({
            locationId: existingSalaryCron.sc_location_id,
            locationName: existingSalaryCron.sc_location_name,
            locationCode: existingSalaryCron.sc_location_code,
            locationTotalGross: existingSalaryCron.sc_gross,
            locationTotalDeduction: existingSalaryCron.sc_total_deduction,
            locationTotalNet: existingSalaryCron.sc_net,
            locationEmployeesCount: existingSalaryCron.sc_employee_count,
            month: existingSalaryCron.sc_month,
            year: existingSalaryCron.sc_year
          });

          continue;
        }

        if (!_.isEmpty(locationData)) {
          const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);

          if (_.isEmpty(employees) || _.isNull(employees)) {
            return res.status(400).json(`No employee in selected locations`);
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
              // let empJobRole = 'N/A'
              // let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id)
              // if(empJobRoleId > 0){
              //     empJobRole = emp.jobRole.job_role
              // }
              //
              // let sectorName = 'N/A'
              // let sectorId = parseInt(employeeSalaries[0].salary_department_id)
              // if (sectorId > 0) {
              //
              //
              //     sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
              // }
              // let salaryObject = {
              //     employeeId: emp.emp_id,
              //     employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
              //     employeeUniqueId: emp.emp_unique_id,
              //     location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
              //     jobRole: empJobRole,
              //     sector: sectorName,
              //     grossSalary: grossSalary,
              //     totalDeduction: totalDeduction,
              //     netSalary: netSalary
              // }
            }
          }

          locationTotalNetPay = locationTotalNetPay + netSalary;
          locationTotalGross = locationTotalGrossII + locationTotalGross;
          locationTotalDeduction = totalDeduction + locationTotalDeduction;

          let locationSalaryObject = {
            locationId: locationData.location_id,
            locationName: locationData.location_name,
            locationCode: locationData.location_t6_code,
            locationTotalGross: locationTotalGross,
            locationTotalDeduction: locationTotalDeduction,
            // locationTotalNet: locationTotalGross - locationTotalDeduction,
            locationTotalNet: locationTotalNetPay,
            locationEmployeesCount: locationTotalEmployee,
            month: payrollMonth,
            year: payrollYear
          };

          await salaryCron.addSalaryCron({
            sc_location_id: locationData.location_id,
            sc_location_name: locationData.location_name,
            sc_location_code: locationData.location_t6_code,
            sc_gross: locationTotalGross,
            sc_total_deduction: locationTotalDeduction,
            sc_net: locationTotalNetPay,
            sc_employee_count: locationTotalEmployee,
            sc_month: payrollMonth,
            sc_year: payrollYear
          });

          locationSalaryArray.push(locationSalaryObject);
        }
      }
      return res.status(200).json(locationSalaryArray);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.get('/pull-confirmed-salary-routine-locations', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run

      let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);
      if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
        return res.status(400).json(`Payroll Routine has not been run for any location`);
      }

      let payrollLocations = await payrollMonthYearLocation.findConfirmedPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
        return res.status(400).json(`No Confirmed payroll Routines`);
      }

      let locationSalaryArray = [];
      for (const location of payrollLocations) {
        const locationData = await locationService.findLocationById(location.pmyl_location_id);

        const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);
        if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
          locationSalaryArray.push({
            locationId: existingSalaryCron.sc_location_id,
            locationName: existingSalaryCron.sc_location_name,
            locationCode: existingSalaryCron.sc_location_code,
            locationTotalGross: existingSalaryCron.sc_gross,
            locationTotalDeduction: existingSalaryCron.sc_total_deduction,
            locationTotalNet: existingSalaryCron.sc_net,
            locationEmployeesCount: existingSalaryCron.sc_employee_count,
            month: existingSalaryCron.sc_month,
            year: existingSalaryCron.sc_year
          });

          continue;
        }

        if (!_.isEmpty(locationData)) {
          const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);

          if (_.isEmpty(employees) || _.isNull(employees)) {
            return res.status(400).json(`No employee in selected locations`);
          }

          let locationTotalGross = 0;
          let locationTotalGrossII = 0;
          let locationTotalGrossI = 0;
          let locationTotalDeduction = 0;
          let mainTotalDeduction = 0;
          let locationMainTotalDeduction = 0;
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
                  grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
                } else {
                  if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
                    mainTotalDeduction = parseFloat(empSalary.salary_amount) + mainTotalDeduction;
                  }
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
              netSalary = grossSalary - totalDeduction;
              // let empJobRole = 'N/A'
              // let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id)
              // if(empJobRoleId > 0){
              //     empJobRole = emp.jobRole.job_role
              // }
              //
              // let sectorName = 'N/A'
              // let sectorId = parseInt(employeeSalaries[0].salary_department_id)
              // if (sectorId > 0) {
              //
              //
              //     sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
              // }
              // let salaryObject = {
              //     employeeId: emp.emp_id,
              //     employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
              //     employeeUniqueId: emp.emp_unique_id,
              //     location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
              //     jobRole: empJobRole,
              //     sector: sectorName,
              //     grossSalary: grossSalary,
              //     totalDeduction: totalDeduction,
              //     netSalary: netSalary
              // }
            }
          }

          locationTotalGross = locationTotalGrossII + locationTotalGross;
          locationTotalDeduction = totalDeduction + locationTotalDeduction;
          locationMainTotalDeduction = mainTotalDeduction + locationMainTotalDeduction;

          let locationSalaryObject = {
            locationId: locationData.location_id,
            locationName: locationData.location_name,
            locationCode: locationData.location_t6_code,
            locationTotalGross: locationTotalGross,
            locationTotalDeduction: locationMainTotalDeduction,
            locationTotalNet: locationTotalGross - locationMainTotalDeduction,
            locationEmployeesCount: locationTotalEmployee,
            month: payrollMonth,
            year: payrollYear
          };

          locationSalaryArray.push(locationSalaryObject);
        }
      }
      return res.status(200).json(locationSalaryArray);
    }
  } catch (err) {
    return res.status(400).json(err?.message);
  }
});

router.get('/pull-approved-salary-routine-locations', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run

      let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
        return res.status(400).json(`Payroll Routine has not been run for any location`);
      }

      let payrollLocations = await payrollMonthYearLocation.findApprovedPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
        return res.status(400).json(`No Approved Payroll Routines`);
      }

      let locationSalaryArray = [];
      for (const location of payrollLocations) {
        const locationData = await locationService.findLocationById(location.pmyl_location_id);

        if (!_.isEmpty(locationData)) {
          const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);
          if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
            locationSalaryArray.push({
              locationId: existingSalaryCron.sc_location_id,
              locationName: existingSalaryCron.sc_location_name,
              locationCode: existingSalaryCron.sc_location_code,
              locationTotalGross: existingSalaryCron.sc_gross,
              locationTotalDeduction: existingSalaryCron.sc_total_deduction,
              locationTotalNet: existingSalaryCron.sc_net,
              locationEmployeesCount: existingSalaryCron.sc_employee_count,
              month: existingSalaryCron.sc_month,
              year: existingSalaryCron.sc_year
            });

            continue;
          }

          const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);

          if (_.isEmpty(employees) || _.isNull(employees)) {
            return res.status(400).json(`No employee in selected locations`);
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
                  grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
                } else {
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
              netSalary = grossSalary - totalDeduction;
              // let empJobRole = 'N/A'
              // let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id)
              // if(empJobRoleId > 0){
              //     empJobRole = emp.jobRole.job_role
              // }
              //
              // let sectorName = 'N/A'
              // let sectorId = parseInt(employeeSalaries[0].salary_department_id)
              // if (sectorId > 0) {
              //
              //
              //     sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
              // }
              // let salaryObject = {
              //     employeeId: emp.emp_id,
              //     employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
              //     employeeUniqueId: emp.emp_unique_id,
              //     location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
              //     jobRole: empJobRole,
              //     sector: sectorName,
              //     grossSalary: grossSalary,
              //     totalDeduction: totalDeduction,
              //     netSalary: netSalary
              // }
            }
          }

          locationTotalGross = locationTotalGrossII + locationTotalGross;
          locationTotalDeduction = totalDeduction + locationTotalDeduction;

          let locationSalaryObject = {
            locationId: locationData.location_id,
            locationName: locationData.location_name,
            locationCode: locationData.location_t6_code,
            locationTotalGross: locationTotalGross,
            locationTotalDeduction: locationTotalDeduction,
            locationTotalNet: locationTotalGross - locationTotalDeduction,
            locationEmployeesCount: locationTotalEmployee,
            month: payrollMonth,
            year: payrollYear
          };

          locationSalaryArray.push(locationSalaryObject);
        }
      }
      return res.status(200).json(locationSalaryArray);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.get('/pull-authorised-salary-routine-locations', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run

      let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
        return res.status(400).json(`Payroll Routine has not been run for any location`);
      }

      let payrollLocations = await payrollMonthYearLocation.findAuthorisedPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

      if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
        return res.status(400).json(`No Authorised Payroll Routines`);
      }

      let locationSalaryArray = [];
      for (const location of payrollLocations) {
        const locationData = await locationService.findLocationById(location.pmyl_location_id);

        if (!_.isEmpty(locationData)) {
          const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);
          if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
            locationSalaryArray.push({
              locationId: existingSalaryCron.sc_location_id,
              locationName: existingSalaryCron.sc_location_name,
              locationCode: existingSalaryCron.sc_location_code,
              locationTotalGross: existingSalaryCron.sc_gross,
              locationTotalDeduction: existingSalaryCron.sc_total_deduction,
              locationTotalNet: existingSalaryCron.sc_net,
              locationEmployeesCount: existingSalaryCron.sc_employee_count,
              month: existingSalaryCron.sc_month,
              year: existingSalaryCron.sc_year
            });

            continue;
          }

          const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);
          // const employees = await employee.getAllEmployeesByLocation(location.pmyl_location_id).then((data) => {
          //     return data
          // })

          if (_.isEmpty(employees) || _.isNull(employees)) {
            return res.status(400).json(`No employee in selected locations`);
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
                  grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
                } else {
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
              netSalary = grossSalary - totalDeduction;
              // let empJobRole = 'N/A'
              // let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id)
              // if(empJobRoleId > 0){
              //     empJobRole = emp.jobRole.job_role
              // }
              //
              // let sectorName = 'N/A'
              // let sectorId = parseInt(employeeSalaries[0].salary_department_id)
              // if (sectorId > 0) {
              //
              //
              //     sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
              // }
              // let salaryObject = {
              //     employeeId: emp.emp_id,
              //     employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
              //     employeeUniqueId: emp.emp_unique_id,
              //     location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
              //     jobRole: empJobRole,
              //     sector: sectorName,
              //     grossSalary: grossSalary,
              //     totalDeduction: totalDeduction,
              //     netSalary: netSalary
              // }
            }
          }

          locationTotalGross = locationTotalGrossII + locationTotalGross;
          locationTotalDeduction = totalDeduction + locationTotalDeduction;

          let locationSalaryObject = {
            locationId: locationData.location_id,
            locationName: locationData.location_name,
            locationCode: locationData.location_t6_code,
            locationTotalGross: locationTotalGross,
            locationTotalDeduction: locationTotalDeduction,
            locationTotalNet: locationTotalGross - locationTotalDeduction,
            locationEmployeesCount: locationTotalEmployee,
            month: payrollMonth,
            year: payrollYear
          };

          locationSalaryArray.push(locationSalaryObject);
        }
      }
      return res.status(200).json(locationSalaryArray);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/pull-approved-salary-routine-locations', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run

    let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
      return res.status(400).json(`Payroll Routine has not been run for any location`);
    }

    let payrollLocations = await payrollMonthYearLocation.findApprovedPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
      return res.status(400).json(`No Approved Payroll Routines`);
    }

    let locationSalaryArray = [];
    for (const location of payrollLocations) {
      const locationData = await locationService.findLocationById(location.pmyl_location_id);
      if (!_.isEmpty(locationData)) {
        const existingSalaryCron = await salaryCron.getSalaryCronByMonthYearLocation(payrollMonth, payrollYear, location.pmyl_location_id);
        if (!_.isEmpty(existingSalaryCron) || !_.isNull(existingSalaryCron)) {
          locationSalaryArray.push({
            locationId: existingSalaryCron.sc_location_id,
            locationName: existingSalaryCron.sc_location_name,
            locationCode: existingSalaryCron.sc_location_code,
            locationTotalGross: existingSalaryCron.sc_gross,
            locationTotalDeduction: existingSalaryCron.sc_total_deduction,
            locationTotalNet: existingSalaryCron.sc_net,
            locationEmployeesCount: existingSalaryCron.sc_employee_count,
            month: existingSalaryCron.sc_month,
            year: existingSalaryCron.sc_year
          });

          continue;
        }

        const employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location.pmyl_location_id);

        if (_.isEmpty(employees) || _.isNull(employees)) {
          return res.status(400).json(`No employee in selected locations`);
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
                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
              } else {
                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              }
            }
            netSalary = grossSalary - totalDeduction;
          }
        }

        locationTotalGross = locationTotalGrossII + locationTotalGross;
        locationTotalDeduction = totalDeduction + locationTotalDeduction;
        let locationSalaryObject = {
          locationId: locationData.location_id,
          locationName: locationData.location_name,
          locationCode: locationData.location_t6_code,
          locationTotalGross: locationTotalGross,
          locationTotalDeduction: locationTotalDeduction,
          locationTotalNet: locationTotalGross - locationTotalDeduction,
          locationEmployeesCount: locationTotalEmployee,
          month: payrollMonth,
          year: payrollYear
        };

        locationSalaryArray.push(locationSalaryObject);
      }
    }
    return res.status(200).json(locationSalaryArray);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.get('/pull-emolument/:locationId', auth(), async function (req, res, next) {
  try {
    const pmylLocationId = parseInt(req.params.locationId);

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      let employees = [];
      if (pmylLocationId === 0) {
        employees = await employee.getEmployees();
      } else {
        employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, pmylLocationId);
        employees = employees.map((emp) => {
          return { emp_id: emp.salary_empid };
        });
      }

      if (_.isEmpty(employees) || _.isNull(employees)) {
        return res.status(400).json(`No Employees Selected Location`);
      }

      for (const emp of employees) {
        let grossSalary = 0;
        let netSalary = 0;
        let totalDeduction = 0;

        let deductions = [];
        let incomes = [];

        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          let empAdjustedGrossII = 0;
          let mainDeductions = 0;
          //let empSalaryStructureName = 'N/A';
          // let empSalaryStructure = await salaryStructure.findEmployeeSalaryStructure(emp.emp_id);
          //
          // if (!_.isEmpty(empSalaryStructure)) {
          //   if (!_.isNull(empSalaryStructure.salary_grade) || !_.isEmpty(empSalaryStructure.salary_grade)) {
          //     empSalaryStructureName = empSalaryStructure.salary_grade.sg_name;
          //   }
          // }

          for (const empSalary of employeeSalaries) {
            // if (parseInt(empSalary.payment.pd_employee) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              incomes.push(incomeDetails);
              if (parseInt(empSalary.payment.pd_employee) === 1) {
                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
              }
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              deductions.push(deductionDetails);
              mainDeductions = parseFloat(empSalary.salary_amount) + mainDeductions;
              if (parseInt(empSalary.payment.pd_employee) === 1) {
                if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
            }

            if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
              if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
              }
            }

            // }
          }
          netSalary = grossSalary - mainDeductions;

          let empJobRole = 'N/A';
          let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
          if (empJobRoleId > 0) {
            let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
            if (!_.isEmpty(jobRoleData)) {
              empJobRole = jobRoleData.job_role;
            }
          }

          let sectorName = 'N/A';
          let sectorId = parseInt(employeeSalaries[0].salary_department_id);
          if (sectorId > 0) {
            let sectorData = await departmentService.findDepartmentById(sectorId);
            if (!_.isEmpty(sectorData)) {
              sectorName = sectorData.department_name;
            }
          }

          let locationName = 'N/A';
          let locationId = parseInt(employeeSalaries[0].salary_location_id);
          if (locationId > 0) {
            let locationData = await locationService.findLocationById(locationId);
            if (!_.isEmpty(locationData)) {
              locationName = `${locationData.l_t6_code}`;
            }
          }
          let empSalaryStructureName = employeeSalaries[0]?.salary_grade;

          let approvedBy = 'N/A';
          let approvedDate = 'N/A';
          let authorisedBy = 'N/A';
          let authorisedDate = 'N/A';
          let confirmedBy = 'N/A';
          let confirmedDate = 'N/A';

          const approvedByData = await user.findUserByUserId(employeeSalaries[0].salary_approved_by);
          if (!_.isEmpty(approvedByData)) {
            approvedBy = `${approvedByData.user_name}`;
            approvedDate = new Date(employeeSalaries[0].salary_approved_date).toISOString().split('T')[0];
          }

          const authorisedByData = await user.findUserByUserId(employeeSalaries[0].salary_authorised_by);
          if (!_.isEmpty(authorisedByData)) {
            authorisedBy = `${authorisedByData.user_name}`;
            authorisedDate = new Date(employeeSalaries[0].salary_authorised_date).toISOString().split('T')[0];
          }

          const confirmedByData = await user.findUserByUserId(employeeSalaries[0].salary_confirmed_by);
          if (!_.isEmpty(confirmedByData)) {
            confirmedBy = `${confirmedByData.user_name}`;
            confirmedDate = new Date(employeeSalaries[0].salary_confirmed_date).toISOString().split('T')[0];
          }

          let salaryObject = {
            employeeId: emp.salary_empid,
            employeeName: employeeSalaries[0].salary_emp_name,
            employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
            location: locationName,
            jobRole: empJobRole,
            sector: sectorName,
            grossSalary: empAdjustedGrossII,
            totalDeduction: totalDeduction,
            netSalary: netSalary,
            incomes: incomes,
            deductions: deductions,
            month: payrollMonth,
            year: payrollYear,
            employeeStartDate: new Date(employeeSalaries[0].salary_emp_start_date).toISOString().split('T')[0],
            empEndDate: new Date(employeeSalaries[0].salary_emp_end_date).toISOString().split('T')[0],
            salaryGrade: empSalaryStructureName,
            approvedBy,
            approvedDate,
            authorisedBy,
            authorisedDate,
            confirmedBy,
            confirmedDate
          };

          employeeSalary.push(salaryObject);
        }
      }
      return res.status(200).json(employeeSalary);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/pull-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;

    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const employees = await employee.getActiveEmployees();

      for (const emp of employees) {
        let grossSalary = 0;
        let netSalary = 0;
        let totalDeduction = 0;

        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          for (const empSalary of employeeSalaries) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
            } else {
              totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
            }
          }
          netSalary = grossSalary - totalDeduction;

          let empJobRole = 'N/A';
          if (parseInt(employeeSalaries[0].salary_jobrole_id) > 0) {
            const jobRole = await jobRoleService.findJobRoleById(empSalary[0].salary_jobrole_id);
            empJobRole = jobRole.job_role;
          }

          let sectorName = 'N/A';
          if (parseInt(employeeSalaries[0].salary_department_id) > 0) {
            const sector = await departmentService.findDepartmentById(empSalary[0].salary_department_id);
            sectorName = `${sector.department_name} - ${sector.d_t3_code}`;
          }

          let salaryObject = {
            employeeId: emp.emp_id,
            employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
            employeeUniqueId: emp.emp_unique_id,
            location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
            jobRole: empJobRole,
            sector: sectorName,
            grossSalary: grossSalary,
            totalDeduction: totalDeduction,
            netSalary: netSalary
          };

          employeeSalary.push(salaryObject);
        }
      }
      return res.status(200).json(employeeSalary);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.get('/approve-salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run
      let employeeSalary = [];
      const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

      if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
        return res.status(400).json(`Payroll Routine has not been run`);
      } else {
        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

        const approveResponse = await salary.approveSalary(payrollMonth, payrollYear, req.user.username.user_id, date);
        if (!(_.isEmpty(approveResponse) || _.isNull(approveResponse))) {
          const logData = {
            log_user_id: req.user.username.user_id,
            log_description: `approved payroll routine for ${payrollMonth} - ${payrollYear}`,
            log_date: new Date()
          };
          await logs.addLog(logData);
          return res.status(200).json(`Payroll Approved`);
        }
      }
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.get('/confirm-salary-routine', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    } else {
      const payrollMonth = payrollMonthYearData.pym_month;
      const payrollYear = payrollMonthYearData.pym_year;
      //check if payroll routine has been run
      let employeeSalary = [];
      const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

      if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
        return res.status(400).json(`Payroll Routine has not been run`);
      } else {
        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

        const confirmResponse = await salary.confirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date);
        if (!(_.isEmpty(confirmResponse) || _.isNull(confirmResponse))) {
          const logData = {
            log_user_id: req.user.username.user_id,
            log_description: `Confirmed payroll routine for ${payrollMonth} - ${payrollYear}`,
            log_date: new Date()
          };
          await logs.addLog(logData);
          return res.status(200).json(`Payroll Routine Confirmed`);
        }
      }
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/confirm-salary-routine', auth(), async function (req, res, next) {
  try {
    let locations = req.body.pmyl_location_id;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    if (_.isEmpty(locations) || _.isNull(locations)) {
      return res.status(400).json(`No Location Selected`);
    }
    const countLocations = locations.length;
    let i = 0;

    for (const location of locations) {
      let confirmRoutine = await payrollMonthYearLocation.confirmPayrollMonthYearLocation(
        location,
        req.user.username.user_id,
        date,
        payrollMonth,
        payrollYear
      );

      if (_.isEmpty(confirmRoutine) || _.isNull(confirmRoutine)) {
        return res.status(400).json(`An error occurred while confirming one or more location routine `);
      }

      await salary.confirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);
      i++;
    }

    if (countLocations === i) {
      const logData = {
        log_user_id: req.user.username.user_id,
        log_description: `Confirmed payroll routine for ${payrollMonth} - ${payrollYear}`,
        log_date: new Date()
      };
      await logs.addLog(logData);
      return res.status(200).json(`Payroll Confirmed`);
    } else {
      return res.status(400).json(`An Error Occurred`);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/unconfirm-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.array().items(Joi.number()).required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    // let employeeId = req.body.employee
    let locations = req.body.pmyl_location_id;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);
    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    for (const location of locations) {
      let checkRoutine = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, location);

      if (_.isEmpty(checkRoutine) || _.isNull(checkRoutine)) {
        console.log(`Payroll Routine has not been run for one or more location, check selection`);
        continue;
      }

      let unconfirmRoutine = await payrollMonthYearLocation.unconfirmPayrollMonthYearLocation(
        location,
        req.user.username.user_id,
        date,
        payrollMonth,
        payrollYear
      );

      if (_.isEmpty(unconfirmRoutine) || _.isNull(unconfirmRoutine)) {
        console.log(`An error occurred while approve one or more location routine `);
        continue;
      }

      await salary.unconfirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);
    }
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Return payroll routine for ${payrollMonth} - ${payrollYear}`,
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json(`Payroll Unconfirmed`);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/unconfirms-salary-routine', auth(), async function (req, res, next) {
  try {
    let locations = req.body.pmyl_location_id;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    if (_.isEmpty(locations) || _.isNull(locations)) {
      return res.status(400).json(`No Location Selected`);
    }
    const countLocations = locations.length;
    let i = 0;

    for (const location of locations) {
      let confirmRoutine = await payrollMonthYearLocation.unconfirmPayrollMonthYearLocation(
        location,
        req.user.username.user_id,
        date,
        payrollMonth,
        payrollYear
      );

      if (_.isEmpty(confirmRoutine) || _.isNull(confirmRoutine)) {
        return res.status(400).json(`An error occurred while confirming one or more location routine `);
      }

      await salary.unconfirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);
      i++;
    }

    if (countLocations === i) {
      const logData = {
        log_user_id: req.user.username.user_id,
        log_description: `Unconfirmed payroll routine for ${payrollMonth} - ${payrollYear}`,
        log_date: new Date()
      };
      await logs.addLog(logData);
      return res.status(200).json(`Payroll Unconfirmed`);
    } else {
      return res.status(400).json(`An Error Occurred`);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/approve-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required(),
      pmyl_comment: Joi.string().default(null)
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    // let employeeId = req.body.employee
    let location = req.body.pmyl_location_id;
    let comment = req.body.pmyl_comment;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    let checkRoutine = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, location);

    if (_.isEmpty(checkRoutine) || _.isNull(checkRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for one or more location, check selection`);
    }

    if (parseInt(checkRoutine.pmyl_confirmed) === 0) {
      return res.status(400).json(`Payroll Routine for location has not been confirmed`);
    }

    if (parseInt(checkRoutine.pmyl_authorised) === 0) {
      return res.status(400).json(`Payroll Routine has not been authorised`);
    }

    if (parseInt(checkRoutine.pmyl_approved) === 1) {
      return res.status(400).json(`Payroll Routine for location has already been approved`);
    }

    let approveRoutine = await payrollMonthYearLocation.approvePayrollMonthYearLocation(
      location,
      req.user.username.user_id,
      date,
      payrollMonth,
      payrollYear,
      comment
    );

    if (_.isEmpty(approveRoutine) || _.isNull(approveRoutine)) {
      return res.status(400).json(`An error occurred while approve one or more location routine `);
    }

    let approveResponse = await salary.approveSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);

    const empSalaries = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
    // return res.status(200).json(empSalaries)
    let tempParamsArray = [];
    for (const emp of empSalaries) {
      let tempEmp = await employee.getEmployee(emp.salary_empid);

      let empJobRole = 'N/A';
      if (parseInt(tempEmp.emp_job_role_id) > 0) {
        empJobRole = tempEmp.jobrole.job_role;
      }

      let sectorName = 'N/A';
      if (parseInt(tempEmp.emp_department_id) > 0) {
        sectorName = `${tempEmp.sector.department_name} - ${tempEmp.sector.d_t3_code}`;
      }

      let urlString = JSON.stringify({
        employee: emp.salary_empid,
        month: parseInt(payrollMonth),
        year: parseInt(payrollYear)
      });
      urlString = btoa(urlString);

      const templateParams = {
        monthYear: `${payrollMonth} ${payrollYear}`,
        name: `${tempEmp.emp_first_name} ${tempEmp.emp_last_name}`,
        department: sectorName,
        jobRole: empJobRole,
        employeeId: emp.salary_empid,
        monthNumber: parseInt(payrollMonth),
        yearNumber: parseInt(payrollYear),
        urlString: urlString
      };

      tempParamsArray.push(templateParams);

      await mailer.paySlipSendMail('noreply@ircng.org', tempEmp.emp_office_email, 'Payslip Notification', templateParams);
    }

    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Approved payroll routine for ${payrollMonth} - ${payrollYear}`,
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json(tempParamsArray);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/unapprove-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required(),
      pmyl_comment: Joi.string().default(null)
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    // let employeeId = req.body.employee
    let location = req.body.pmyl_location_id;
    let comment = req.body.pmyl_comment;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);
    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    let checkRoutine = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, location);

    if (_.isEmpty(checkRoutine) || _.isNull(checkRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for one or more location, check selection`);
    }

    let unauthorisedRoutine = await payrollMonthYearLocation.unapprovePayrollMonthYearLocation(
      location,
      req.user.username.user_id,
      date,
      payrollMonth,
      payrollYear,
      comment
    );

    if (_.isEmpty(unauthorisedRoutine) || _.isNull(unauthorisedRoutine)) {
      return res.status(400).json(`An error occurred while approve one or more location routine `);
    }

    await salary.unapproveSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);

    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Unapproved payroll routine for ${payrollMonth} - ${payrollYear}`,
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json(`Payroll Unapproved`);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/authorise-salary-routine', auth(), async function (req, res, next) {
  try {
    let locations = req.body.pmyl_location_id;
    let comment = req.body.pmyl_comment;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);

    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    if (_.isEmpty(locations) || _.isNull(locations)) {
      return res.status(400).json(`No Location Selected`);
    }
    const countLocations = locations.length;
    let i = 0;

    for (const location of locations) {
      let authoriseRoutine = await payrollMonthYearLocation.authorisePayrollMonthYearLocation(
        location,
        req.user.username.user_id,
        date,
        payrollMonth,
        payrollYear,
        comment
      );

      if (_.isEmpty(authoriseRoutine) || _.isNull(authoriseRoutine)) {
        return res.status(400).json(`An error occurred while authorising one or more location routine `);
      }

      await salary.authoriseSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);
      i++;
    }

    if (countLocations === i) {
      const logData = {
        log_user_id: req.user.username.user_id,
        log_description: `Authorised payroll routine for ${payrollMonth} - ${payrollYear}`,
        log_date: new Date()
      };
      await logs.addLog(logData);
      return res.status(200).json(`Payroll Routine Authorised`);
    } else {
      return res.status(400).json(`An Error Occurred`);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/unauthorise-salary-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.array().items(Joi.number()).required(),
      pmyl_comment: Joi.string().default(null)
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    let locations = req.body.pmyl_location_id;
    let comment = req.body.pmyl_comment;

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let checkSuperRoutine = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear);
    if (_.isEmpty(checkSuperRoutine) || _.isNull(checkSuperRoutine)) {
      return res.status(400).json(`Payroll Routine has not been run for payroll month and year`);
    }

    for (const location of locations) {
      let checkRoutine = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, location);

      if (_.isEmpty(checkRoutine) || _.isNull(checkRoutine)) {
        console.log(`Payroll Routine has not been run for one or more location, check selection`);
        continue;
      }

      let unauthorisedRoutine = await payrollMonthYearLocation.unauthorisePayrollMonthYearLocation(
        location,
        req.user.username.user_id,
        date,
        payrollMonth,
        payrollYear,
        comment
      );

      if (_.isEmpty(unauthorisedRoutine) || _.isNull(unauthorisedRoutine)) {
        console.log(`An error occurred while approve one or more location routine `);
        continue;
      }

      await salary.unauthoriseSalary(payrollMonth, payrollYear, req.user.username.user_id, date, location);
    }
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Unathorised payroll routine for ${payrollMonth} - ${payrollYear}`,
      log_date: new Date()
    };
    await logs.addLog(logData);
    return res.status(200).json(`Payroll Unauthorised`);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.get('/pull-salary-routine/:empId/', auth(), async function (req, res, next) {
  try {
    //
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const payrollMonth = payrollMonthYearData.pmy_month;
    const payrollYear = payrollMonthYearData.pmy_year;
    //check if payroll routine has been run

    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    let nsitfPayments = await paymentDefinition.getNsitfPayments();

    if (_.isNull(nsitfPayments) || _.isEmpty(nsitfPayments)) {
      return res.status(400).json(`No payments marked as nsift`);
    }

    let pensionPayments = await paymentDefinition.getPensionPayments();
    if (_.isNull(pensionPayments) || _.isEmpty(pensionPayments)) {
      return res.status(400).json(`No payments marked as pension`);
    }

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const emp = await employee.getEmployee(parseInt(req.params.empId));

      if (_.isEmpty(emp) || _.isNull(emp)) {
        return res.status(400).json(`Employee Doesnt Exist`);
      }

      let grossSalary = 0;
      let netSalary = 0;
      let totalDeduction = 0;
      let deductions = [];
      let incomes = [];
      let employersIncomes = [];
      let employersDeductions = [];
      let empAdjustedGross = 0;
      let empAdjustedGrossII = 0;
      let totalPension = 0;
      let totalNsitf = 0;

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_employee) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              incomes.push(incomeDetails);
              grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;

              if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                empAdjustedGross = empAdjustedGross + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
              }
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              deductions.push(deductionDetails);
              totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                empAdjustedGross = empAdjustedGross - parseFloat(empSalary.salary_amount);
              }
              if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
              }
            }
          }

          if (parseInt(empSalary.payment.pd_employee) === 2) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              employersIncomes.push(incomeDetails);
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              employersDeductions.push(deductionDetails);
            }
          }
        }

        netSalary = grossSalary - totalDeduction;

        let empJobRole = 'N/A';
        if (parseInt(employeeSalaries[0].salary_jobrole_id) > 0) {
          const jobRole = await jobRoleService.findJobRoleById(employeeSalaries[0].salary_jobrole_id);
          empJobRole = jobRole.job_role;
        }

        let sectorName = 'N/A';
        if (parseInt(employeeSalaries[0].salary_department_id) > 0) {
          const sector = await departmentService.findDepartmentById(employeeSalaries[0].salary_department_id);
          sectorName = `${sector.department_name} - ${sector.d_t3_code}`;
        }

        let locationName = 'N/A';
        const locationId = employeeSalaries[0].salary_location_id;
        if (parseInt(employeeSalaries[0].salary_location_id) > 0) {
          const location = await locationService.findLocationById(employeeSalaries[0].salary_location_id);
          locationName = `${location.location_name} - ${location.l_t6_code}`;
        }

        for (const pensionPayment of pensionPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, pensionPayment.pd_id);

          if (parseInt(pensionPayment.pd_employee) === 2) {
            if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
              amount = parseFloat(checkSalary.salary_amount);
              totalPension = totalPension + amount;
            }
          }
        }

        for (const nsitfPayment of nsitfPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, nsitfPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }

          totalNsitf = totalNsitf + amount;
        }

        let employeeSalary = {
          employeeId: emp.emp_id,
          employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
          employeeUniqueId: emp.emp_unique_id,
          location: locationName,
          locationId: locationId,
          jobRole: empJobRole,
          sector: sectorName,
          grossSalary: grossSalary,
          nsitf: totalNsitf,
          pension: totalPension,
          employersDeductions: employersDeductions,
          employersIncomes: employersIncomes,
          totalDeduction: totalDeduction,
          netSalary: netSalary,
          incomes: incomes,
          deductions: deductions,
          month: payrollMonth,
          year: payrollYear
        };

        return res.status(200).json(employeeSalary);
      } else {
        return res.status(200).json(`No Salary for Employee`);
      }
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/pull-salary-routine/:empId', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run

    let nsitfPayments = await paymentDefinition.getNsitfPayments();

    if (_.isNull(nsitfPayments) || _.isEmpty(nsitfPayments)) {
      return res.status(400).json(`No payments marked as nsift`);
    }

    let pensionPayments = await paymentDefinition.getPensionPayments();
    if (_.isNull(pensionPayments) || _.isEmpty(pensionPayments)) {
      return res.status(400).json(`No payments marked as pension`);
    }

    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const emp = await employee.getEmployee(parseInt(req.params.empId));

      if (_.isEmpty(emp) || _.isNull(emp)) {
        return res.status(400).json(`Employee Doesnt Exist`);
      }

      let grossSalary = 0;
      let netSalary = 0;
      let totalDeduction = 0;
      let deductions = [];
      let incomes = [];
      let employersIncomes = [];
      let employersDeductions = [];
      let empAdjustedGross = 0;
      let empAdjustedGrossII = 0;
      let totalPension = 0;
      let totalNsitf = 0;

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        if (parseInt(employeeSalaries[0].salary_approved) === 0) {
          return res.status(400).json(`Salary for this month has not been approved`);
        }

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_employee) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              incomes.push(incomeDetails);
              grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;

              if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                empAdjustedGross = empAdjustedGross + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
              }
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              deductions.push(deductionDetails);
              totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                empAdjustedGross = empAdjustedGross - parseFloat(empSalary.salary_amount);
              }
              if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
              }
            }
          }

          if (parseInt(empSalary.payment.pd_employee) === 2) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              employersIncomes.push(incomeDetails);
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              employersDeductions.push(deductionDetails);
            }
          }
        }

        netSalary = grossSalary - totalDeduction;

        let empJobRole = 'N/A';
        if (parseInt(employeeSalaries[0].salary_jobrole_id) > 0) {
          const jobRole = await jobRoleService.findJobRoleById(employeeSalaries[0].salary_jobrole_id);
          empJobRole = jobRole.job_role;
        }

        let sectorName = 'N/A';
        if (parseInt(employeeSalaries[0].salary_department_id) > 0) {
          const sector = await departmentService.findDepartmentById(employeeSalaries[0].salary_department_id);
          sectorName = `${sector.department_name} - ${sector.d_t3_code}`;
        }

        let locationName = 'N/A';
        const locationId = employeeSalaries[0].salary_location_id;
        if (parseInt(employeeSalaries[0].salary_location_id) > 0) {
          const location = await locationService.findLocationById(employeeSalaries[0].salary_location_id);
          locationName = `${location.location_name} - ${location.l_t6_code}`;
        }

        for (const pensionPayment of pensionPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, pensionPayment.pd_id);

          if (parseInt(pensionPayment.pd_employee) === 2) {
            if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
              amount = parseFloat(checkSalary.salary_amount);
              totalPension = totalPension + amount;
            }
          }
        }

        for (const nsitfPayment of nsitfPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, nsitfPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }

          totalNsitf = totalNsitf + amount;
        }

        let employeeSalary = {
          employeeId: emp.emp_id,
          employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
          employeeUniqueId: emp.emp_unique_id,
          location: locationName,
          locationId: locationId,
          jobRole: empJobRole,
          sector: sectorName,
          grossSalary: grossSalary,
          nsitf: totalNsitf,
          pension: totalPension,
          employersDeductions: employersDeductions,
          employersIncomes: employersIncomes,
          totalDeduction: totalDeduction,
          netSalary: netSalary,
          incomes: incomes,
          deductions: deductions,
          month: payrollMonth,
          year: payrollYear
        };

        return res.status(200).json(employeeSalary);
      } else {
        return res.status(200).json(`No Salary for Employee`);
      }
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/pull-emolument', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pmyl_location_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const pmylLocationId = payrollRequest.pmyl_location_id;
      let employees = [];
      if (pmylLocationId === 0) {
        employees = await employee.getEmployees();
      } else {
        employees = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, pmylLocationId);
        employees = employees.map((emp) => {
          return { emp_id: emp.salary_empid };
        });
      }

      if (_.isEmpty(employees) || _.isNull(employees)) {
        return res.status(400).json(`No Employees Selected Location`);
      }

      for (const emp of employees) {
        let grossSalary = 0;
        let netSalary = 0;
        let totalDeduction = 0;
        let deductions = [];
        let incomes = [];

        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          let empAdjustedGrossII = 0;
          let mainDeductions = 0;
          //let empSalaryStructureName = 'N/A';
          // let empSalaryStructure = await salaryStructure.findEmployeeSalaryStructure(emp.emp_id);
          //
          // if (!_.isEmpty(empSalaryStructure)) {
          //   if (!_.isNull(empSalaryStructure.salary_grade) || !_.isEmpty(empSalaryStructure.salary_grade)) {
          //     empSalaryStructureName = empSalaryStructure.salary_grade.sg_name;
          //   }
          // }

          for (const empSalary of employeeSalaries) {
            // if (parseInt(empSalary.payment.pd_employee) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              const incomeDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              incomes.push(incomeDetails);
              if (parseInt(empSalary.payment.pd_employee) === 1) {
                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
              }
            } else {
              const deductionDetails = {
                paymentName: empSalary.payment.pd_payment_name,
                amount: empSalary.salary_amount
              };
              deductions.push(deductionDetails);
              mainDeductions = parseFloat(empSalary.salary_amount) + mainDeductions;
              if (parseInt(empSalary.payment.pd_employee) === 1) {
                if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
            }

            if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
              if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
              }

              if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
              }
            }

            // }
          }
          netSalary = grossSalary - mainDeductions;

          let empJobRole = 'N/A';
          let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
          if (empJobRoleId > 0) {
            let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
            if (!_.isEmpty(jobRoleData)) {
              empJobRole = jobRoleData.job_role;
            }
          }

          let sectorName = 'N/A';
          let sectorId = parseInt(employeeSalaries[0].salary_department_id);
          if (sectorId > 0) {
            let sectorData = await departmentService.findDepartmentById(sectorId);
            if (!_.isEmpty(sectorData)) {
              sectorName = sectorData.department_name;
            }
          }

          let locationName = 'N/A';
          let locationId = parseInt(employeeSalaries[0].salary_location_id);
          if (locationId > 0) {
            let locationData = await locationService.findLocationById(locationId);
            if (!_.isEmpty(locationData)) {
              locationName = `${locationData.l_t6_code}`;
            }
          }

          let empSalaryStructureName = employeeSalaries[0]?.salary_grade;

          let salaryObject = {
            employeeId: emp.emp_id,
            employeeD7: employeeSalaries[0].salary_d7,
            /*employeeD4: emp.operationUnit.ou_name,
                        employeeD6: emp.functionalArea.fa_name,
                        employeeD5: emp.reportingEntity.re_name,*/
            employeeName: employeeSalaries[0].salary_emp_name,
            employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
            location: locationName,
            jobRole: empJobRole,
            sector: sectorName,
            grossSalary: empAdjustedGrossII,
            totalDeduction: totalDeduction,
            netSalary: netSalary,
            incomes: incomes,
            deductions: deductions,
            month: payrollMonth,
            year: payrollYear,
            employeeStartDate: new Date(employeeSalaries[0].salary_emp_start_date).toISOString().split('T')[0],
            empEndDate: new Date(employeeSalaries[0].salary_emp_end_date).toISOString().split('T')[0],
            salaryGrade: empSalaryStructureName
          };

          employeeSalary.push(salaryObject);
        }
      }
      return res.status(200).json(employeeSalary);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/deduction-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const employees = await employee.getActiveEmployees();
      for (const emp of employees) {
        let totalDeduction = 0;

        let deductions = [];

        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          for (const empSalary of employeeSalaries) {
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                const deductionDetails = {
                  paymentName: empSalary.payment.pd_payment_name,
                  amount: empSalary.salary_amount
                };
                deductions.push(deductionDetails);
                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              }
            }
          }

          let empJobRole = 'N/A';
          let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
          if (empJobRoleId > 0) {
            let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
            if (!_.isEmpty(jobRoleData)) {
              empJobRole = jobRoleData.job_role;
            }
          }

          let sectorName = 'N/A';
          let sectorId = parseInt(employeeSalaries[0].salary_department_id);
          if (sectorId > 0) {
            let sectorData = await departmentService.findDepartmentById(sectorId);
            if (!_.isEmpty(sectorData)) {
              sectorName = sectorData.department_name;
            }
          }

          let locationName = 'N/A';
          let locationId = parseInt(employeeSalaries[0].salary_location_id);
          if (locationId > 0) {
            let locationData = await locationService.findLocationById(locationId);
            if (!_.isEmpty(locationData)) {
              locationName = `${locationData.l_t6_code}`;
            }
          }

          let salaryObject = {
            employeeId: emp.emp_id,

            employeeD7: employeeSalaries[0].salary_d7,
            /*employeeD4: emp.operationUnit.ou_name,
                        employeeD6: emp.functionalArea.fa_name,
                        employeeD5: emp.reportingEntity.re_name,*/

            employeeName: employeeSalaries[0].salary_emp_name,
            employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
            location: locationName,
            jobRole: empJobRole,
            sector: sectorName,
            totalDeduction: totalDeduction,
            deductions: deductions,
            month: payrollMonth,
            year: payrollYear
          };

          employeeSalary.push(salaryObject);
        }
      }
      return res.status(200).json(employeeSalary);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/variation-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    } else {
      const employees = await employee.getActiveEmployees();

      for (const emp of employees) {
        let grossSalary = 0;
        let netSalary = 0;
        let totalDeduction = 0;

        let deductions = [];
        let incomes = [];

        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
          for (const empSalary of employeeSalaries) {
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              if (parseInt(empSalary.payment.pd_payment_variant) === 2) {
                if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                  const incomeDetails = {
                    paymentName: empSalary.payment.pd_payment_name,
                    amount: empSalary.salary_amount
                  };
                  incomes.push(incomeDetails);
                  grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
                } else {
                  const deductionDetails = {
                    paymentName: empSalary.payment.pd_payment_name,
                    amount: empSalary.salary_amount
                  };
                  deductions.push(deductionDetails);
                  totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
                }
              }
            }
          }

          let empJobRole = 'N/A';
          let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
          if (empJobRoleId > 0) {
            let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
            if (!_.isEmpty(jobRoleData)) {
              empJobRole = jobRoleData.job_role;
            }
          }

          let sectorName = 'N/A';
          let sectorId = parseInt(employeeSalaries[0].salary_department_id);
          if (sectorId > 0) {
            let sectorData = await departmentService.findDepartmentById(sectorId);
            if (!_.isEmpty(sectorData)) {
              sectorName = sectorData.department_name;
            }
          }

          let locationName = 'N/A';
          let locationId = parseInt(employeeSalaries[0].salary_location_id);
          if (locationId > 0) {
            let locationData = await locationService.findLocationById(locationId);
            if (!_.isEmpty(locationData)) {
              locationName = `${locationData.l_t6_code}`;
            }
          }

          let salaryObject = {
            employeeId: emp.emp_id,

            employeeD7: emp.emp_d7,
            /*employeeD4: emp.operationUnit.ou_name,
                        employeeD6: emp.functionalArea.fa_name,
                        employeeD5: emp.reportingEntity.re_name,*/

            employeeName: employeeSalaries[0].salary_emp_name,
            employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
            location: locationName,
            jobRole: empJobRole,
            sector: sectorName,
            totalDeduction: totalDeduction,
            deductions: deductions,
            incomes: incomes,
            totalIncomes: grossSalary,
            month: payrollMonth,
            year: payrollYear
          };
          employeeSalary.push(salaryObject);
        }
      }
      return res.status(200).json(employeeSalary);
    }
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/deduction-report-type', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pd_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let paymentDefinitionData = await paymentDefinition.findPaymentById(payrollRequest.pd_id);

    if (_.isEmpty(paymentDefinitionData) || _.isNull(paymentDefinitionData)) {
      return res.status(400).json(`Payment Definition Does Not exist`);
    }

    const employees = await employee.getActiveEmployees();

    for (const emp of employees) {
      let totalDeduction = 0;

      let deductions = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_id) === parseInt(payrollRequest.pd_id)) {
            const deductionDetails = {
              paymentName: empSalary.payment.pd_payment_name,
              amount: empSalary.salary_amount
            };
            deductions.push(deductionDetails);
            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
          }
        }

        let paymentNumber = 'N/A';
        if (parseInt(paymentDefinitionData.pd_tie_number) > 0) {
          let tieNumber = parseInt(paymentDefinitionData.pd_tie_number);
          if (tieNumber === 1) {
            paymentNumber = emp.emp_paye_no;
          }

          if (tieNumber === 2) {
            paymentNumber = emp.emp_pension_no;
          }

          if (tieNumber === 3) {
            paymentNumber = emp.emp_nhf;
          }
        }

        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorCode = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = `${sectorData.department_name} - ${sectorData.d_t3_code}`;
            sectorCode = sectorData.d_t3_code;
          }
        }

        let locationName = 'N/A';
        let locationCode = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.location_name} - ${locationData.l_t6_code}`;
            locationCode = locationData.l_t6_code;
          }
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: emp.emp_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          location: locationName,
          locationCode: locationCode,
          jobRole: empJobRole,
          sector: sectorName,
          sectorCode: sectorCode,
          totalDeduction: totalDeduction,
          deductions: deductions,
          month: payrollMonth,
          year: payrollYear,
          paymentNumber: paymentNumber
        };
        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

/* run salary routine */
router.get('/salary-test-routine', async function (req, res, next) {
  try {
    // let taxableIncome = 660805;

    let welfareIncomes = 287679.625;
    let taxableIncome = 3030575;
    // let taxableIncomeData = await salary.getEmployeeSalary('01', '2022', '5').then((data)=>{
    //     return data
    // })
    //
    // for(const income of taxableIncomeData){
    //     if((parseInt(income.payment.pd_payment_type) === 1) && (parseInt(income.payment.pd_payment_taxable) === 1) ){
    //         taxableIncome = parseFloat(income.salary_amount) + taxableIncome
    //     }
    //
    //     if(parseInt(income.payment.pd_welfare) === 1){
    //         welfareIncomes = welfareIncomes + parseFloat(income.salary_amount)
    //     }
    //
    // }

    let taxRatesData = await taxRates.findAllTaxRate();

    if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
      await salary.undoSalaryMonthYear(payrollMonth, payrollYear);
      return res.status(400).json(`No tax Rate Setup `);
    }
    let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate();

    if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
      await salary.undoSalaryMonthYear('01', '2022');
      return res.status(400).json(`Minimum Tax Rate Not Setup `);
    }

    let paymentDefinitionTaxData = await paymentDefinition.findTax();

    if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
      await salary.undoSalaryMonthYear('01', '2022');
      return res.status(400).json(`No Payment Definition has been Indicated as Tax `);
    }

    let newTaxableIncome = taxableIncome - welfareIncomes;
    let checka = parseFloat(200000 / 12);
    let checkb = parseFloat((1 / 100) * taxableIncome);
    let allowableSum = checka;
    if (checkb > checka) {
      allowableSum = checkb;
    }
    let taxRelief = (20 / 100) * taxableIncome + allowableSum;
    let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * taxableIncome;
    let tempTaxAmount = newTaxableIncome - taxRelief;
    let TtempTaxAmount = tempTaxAmount;
    let cTax;
    let totalTaxAmount = 0;
    let i = 1;

    let taxObjects = [];
    if (parseFloat(tempTaxAmount) > 0) {
      for (const tax of taxRatesData) {
        if (i < parseInt(taxRatesData.length)) {
          if (tempTaxAmount - tax.tr_band / 12 > 0) {
            if (tempTaxAmount >= tax.tr_band / 12) {
              cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
              let taxObject = {
                band: tax.tr_band / 12,
                rate: tax.tr_rate,
                amount: cTax
              };
              taxObjects.push(taxObject);
            } else {
              cTax = (tax.tr_rate / 100) * tempTaxAmount;
              totalTaxAmount = cTax + totalTaxAmount;
              let taxObject = {
                band: tax.tr_band / 12,
                rate: tax.tr_rate,
                amount: cTax
              };
              taxObjects.push(taxObject);
              break;
            }
          } else {
            cTax = (tax.tr_rate / 100) * tempTaxAmount;
            totalTaxAmount = cTax + totalTaxAmount;
            let taxObject = {
              band: tax.tr_band / 12,
              rate: tax.tr_rate,
              amount: cTax
            };
            taxObjects.push(taxObject);
            break;
          }
        } else {
          cTax = (tax.tr_rate / 100) * tempTaxAmount;
          let taxObject = {
            band: tax.tr_band / 12,
            rate: tax.tr_rate,
            amount: cTax
          };
          taxObjects.push(taxObject);
        }
        tempTaxAmount = tempTaxAmount - tax.tr_band / 12;

        totalTaxAmount = cTax + totalTaxAmount;
        i++;
      }

      if (totalTaxAmount <= minimumTax) {
        totalTaxAmount = minimumTax;
      }
    } else {
      totalTaxAmount = minimumTax;
    }

    let object = {
      taxable: taxableIncome,
      tax: totalTaxAmount,
      welfare: welfareIncomes,
      newTax: newTaxableIncome,
      onepercent: checkb,
      twohundred: checka,
      real: allowableSum,
      temptaxamount: TtempTaxAmount,
      newTaxableIncome: newTaxableIncome,
      taxRelief: taxRelief,
      taxObjects: taxObjects
    };
    return res.status(200).json(object);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

/* Pay Order */
router.post('/pay-order', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;
    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    for (const emp of employees) {
      let grossSalary = 0;
      let netSalary = 0;
      let totalDeduction = 0;

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_employee) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
            } else {
              totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
            }
          }
        }
        netSalary = grossSalary - totalDeduction;

        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorCode = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = `${sectorData.department_name} - ${sectorData.d_t3_code}`;
            sectorCode = sectorData.d_t3_code;
          }
        }

        let locationName = 'N/A';
        let locationCode = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.location_name} - ${locationData.l_t6_code}`;
            locationCode = locationData.l_t6_code;
          }
        }

        let bankName = 'N/A';
        let bankSortCode = 'N/A';

        if (parseInt(employeeSalaries[0].salary_bank_id) > 0) {
          bankName = `${employeeSalaries[0].bank.bank_name}`;
          bankSortCode = `${employeeSalaries[0].salary_sort_code}`;
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: emp.emp_d7,
          /* employeeD4: emp.operationUnit.ou_name,
                     employeeD6: emp.functionalArea.fa_name,
                     employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          accountNumber: employeeSalaries[0].salary_account_number,
          location: locationName,
          locationCode: locationCode,
          jobRole: empJobRole,
          sector: sectorName,
          sectorCode: sectorCode,
          bankName: bankName,
          bankSortCode: bankSortCode,
          grossSalary: grossSalary,
          totalDeduction: totalDeduction,
          netSalary: netSalary,
          month: payrollMonth,
          year: payrollYear
        };

        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/pension-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;

    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let pensionPayments = await paymentDefinition.getPensionPayments();
    if (_.isNull(pensionPayments) || _.isEmpty(pensionPayments)) {
      return res.status(400).json(`No payments marked as pension`);
    }

    for (const emp of employees) {
      let pensionArray = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let totalPension = 0;

        let empAdjustedGrossII = 0;
        let fullGross = 0;
        let empAdjustedGross = 0;

        let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

        for (const salary of fullSalaryData) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            fullGross = parseFloat(salary.salary_amount) + fullGross;
          }

          if (parseInt(salary.payment.pd_total_gross) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
            }
          }

          if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
            }
          }
        }

        for (const pensionPayment of pensionPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, pensionPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }
          let empPensionObject = {
            'Payment Name': pensionPayment.pd_payment_name,
            Amount: amount
          };

          totalPension = totalPension + amount;

          pensionArray.push(empPensionObject);
        }

        let pfa = 'N/A';
        if (!_.isNull(employeeSalaries[0].salary_pfa) || parseInt(employeeSalaries[0].salary_pfa) > 0) {
          const pensionProvider = await pensionService.getPensionServiceById(employeeSalaries[0].salary_pfa);
          if (!_.isEmpty(pensionProvider)) {
            pfa = pensionProvider.provider_name;
          }
        }

        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = sectorData.department_name;
          }
        }
        let locationName = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.l_t6_code}`;
          }
        }

        let bankName = 'N/A';
        let bankSortCode = 'N/A';

        if (parseInt(emp.emp_bank_id) > 0) {
          bankName = `${emp.bank.bank_name}`;
          bankSortCode = `${emp.bank.bank_code}`;
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: employeeSalaries[0].salary_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          accountNumber: emp.emp_account_no,
          location: locationName,
          jobRole: empJobRole,
          sector: sectorName,
          pfa: pfa,
          pin: emp.emp_pension_no,
          totalPension: totalPension,
          pensionArray: pensionArray,
          month: payrollMonth,
          year: payrollYear,
          adjustedGrossII: empAdjustedGrossII
        };

        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/nhf-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;
    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let nhfPayments = await paymentDefinition.getNhfPayments();
    if (_.isNull(nhfPayments) || _.isEmpty(nhfPayments)) {
      return res.status(400).json(`No payments marked as nhf`);
    }

    for (const emp of employees) {
      let nhfArray = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let totalNhf = 0;

        let empAdjustedGrossII = 0;
        let fullGross = 0;
        let empAdjustedGross = 0;

        for (const salary of employeeSalaries) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            fullGross = parseFloat(salary.salary_amount) + fullGross;
          }

          if (parseInt(salary.payment.pd_total_gross) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
            }
          }

          if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
            }
          }
        }

        for (const nhfPayment of nhfPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, nhfPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }
          let empNhfObject = {
            'Payment Name': nhfPayment.pd_payment_name,
            Amount: amount
          };

          totalNhf = totalNhf + amount;

          nhfArray.push(empNhfObject);
        }

        let pfa = 'N/A';
        if (!_.isNull(emp.emp_pension_id) || parseInt(emp.emp_pension_id) > 0) {
          pfa = emp.pension.provider_name;
        }

        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = sectorData.department_name;
          }
        }

        let locationName = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.l_t6_code}`;
          }
        }

        let bankName = 'N/A';
        let bankSortCode = 'N/A';

        if (parseInt(emp.emp_bank_id) > 0) {
          bankName = `${emp.bank.bank_name}`;
          bankSortCode = `${emp.bank.bank_code}`;
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: emp.emp_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          accountNumber: emp.emp_account_no,
          location: locationName,
          jobRole: empJobRole,
          sector: sectorName,
          pin: emp.emp_nhf,
          totalNhf: totalNhf,
          nhfArray: nhfArray,
          month: payrollMonth,
          year: payrollYear,
          adjustedGrossII: empAdjustedGrossII,
          adjustedGross: empAdjustedGross
        };

        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/nsitf-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;
    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let nsitfPayments = await paymentDefinition.getNsitfPayments();
    if (_.isNull(nsitfPayments) || _.isEmpty(nsitfPayments)) {
      return res.status(400).json(`No payments marked as nsift`);
    }

    for (const emp of employees) {
      let nsitfArray = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let totalNsitf = 0;

        let empAdjustedGrossII = 0;
        let fullGross = 0;
        let empAdjustedGross = 0;

        for (const salary of employeeSalaries) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            fullGross = parseFloat(salary.salary_amount) + fullGross;
          }

          if (parseInt(salary.payment.pd_total_gross) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
            }
          }

          if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
            }
          }
        }

        for (const nsitfPayment of nsitfPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, nsitfPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }
          let empNsitfObject = {
            'Payment Name': nsitfPayment.pd_payment_name,
            Amount: amount
          };
          totalNsitf = totalNsitf + amount;
          nsitfArray.push(empNsitfObject);
        }
        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = sectorData.department_name;
          }
        }
        let locationName = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.l_t6_code}`;
          }
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: employeeSalaries[0].salary_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          location: locationName,
          jobRole: empJobRole,
          sector: sectorName,
          totalNsitf: totalNsitf,
          nsitfArray: nsitfArray,
          month: payrollMonth,
          year: payrollYear,
          adjustedGrossII: empAdjustedGrossII,
          adjustedGross: empAdjustedGross
        };
        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/severance-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;
    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let severancePayments = await paymentDefinition.getSeverancePayments();
    if (_.isNull(severancePayments) || _.isEmpty(severancePayments)) {
      return res.status(400).json(`No payments marked as nsift`);
    }

    for (const emp of employees) {
      let severanceArray = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let totalSeverance = 0;

        let empAdjustedGrossII = 0;
        let fullGross = 0;
        let empAdjustedGross = 0;

        for (const salary of employeeSalaries) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            fullGross = parseFloat(salary.salary_amount) + fullGross;
          }

          if (parseInt(salary.payment.pd_total_gross) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
            }
          }

          if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
            }
          }
        }

        for (const severancePayment of severancePayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, severancePayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }
          let empSeveranceObject = {
            'Payment Name': severancePayment.pd_payment_name,
            Amount: amount
          };
          totalSeverance = totalSeverance + amount;
          severanceArray.push(empSeveranceObject);
        }
        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = sectorData.department_name;
          }
        }
        let locationName = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.l_t6_code}`;
          }
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: employeeSalaries[0].salary_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          location: locationName,
          jobRole: empJobRole,
          sector: sectorName,
          totalSeverance: totalSeverance,
          severanceArray: severanceArray,
          month: payrollMonth,
          year: payrollYear,
          adjustedGrossII: empAdjustedGrossII,
          adjustedGross: empAdjustedGross,
          gross: employeeSalaries[0].salary_gross,
          fullGross: fullGross
        };
        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/tax-report', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pym_month: Joi.number().required(),
      pym_year: Joi.number().required(),
      pym_location: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const payrollMonth = payrollRequest.pym_month;
    const payrollYear = payrollRequest.pym_year;
    const location = payrollRequest.pym_location;
    let employees = [];
    if (parseInt(location) > 0) {
      const employeesFromSalary = await salary.getDistinctEmployeesLocationMonthYear(payrollMonth, payrollYear, location);
      for (const emp of employeesFromSalary) {
        const tempEmp = await employee.getEmployeeByIdOnly(emp.salary_empid);
        employees.push(tempEmp);
      }
    } else {
      employees = await employee.getEmployees();
    }
    //check if payroll routine has been run
    let employeeSalary = [];
    const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear);
    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    let taxPayments = await paymentDefinition.getTaxPayments();
    if (_.isNull(taxPayments) || _.isEmpty(taxPayments)) {
      return res.status(400).json(`No payments marked as Tax`);
    }

    for (const emp of employees) {
      let taxArray = [];

      let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let totalTax = 0;

        let empAdjustedGrossII = 0;
        let fullGross = 0;
        let empAdjustedGross = 0;

        for (const salary of employeeSalaries) {
          if (parseInt(salary.payment.pd_payment_type) === 1) {
            fullGross = parseFloat(salary.salary_amount) + fullGross;
          }

          if (parseInt(salary.payment.pd_total_gross) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount);
            }
          }

          if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(salary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount);
            }

            if (parseInt(salary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount);
            }
          }
        }

        for (const taxPayment of taxPayments) {
          let amount = 0;

          let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, taxPayment.pd_id);
          if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
            amount = parseFloat(checkSalary.salary_amount);
          }
          let empTaxObject = {
            'Payment Name': taxPayment.pd_payment_name,
            Amount: amount
          };
          totalTax = totalTax + amount;
          taxArray.push(empTaxObject);
        }
        let empJobRole = 'N/A';
        let empJobRoleId = parseInt(employeeSalaries[0].salary_jobrole_id);
        if (empJobRoleId > 0) {
          let jobRoleData = await jobRoleService.findJobRoleById(empJobRoleId);
          if (!_.isEmpty(jobRoleData)) {
            empJobRole = jobRoleData.job_role;
          }
        }

        let sectorName = 'N/A';
        let sectorId = parseInt(employeeSalaries[0].salary_department_id);
        if (sectorId > 0) {
          let sectorData = await departmentService.findDepartmentById(sectorId);
          if (!_.isEmpty(sectorData)) {
            sectorName = sectorData.department_name;
          }
        }
        let locationName = 'N/A';
        let locationId = parseInt(employeeSalaries[0].salary_location_id);
        if (locationId > 0) {
          let locationData = await locationService.findLocationById(locationId);
          if (!_.isEmpty(locationData)) {
            locationName = `${locationData.l_t6_code}`;
          }
        }

        let salaryObject = {
          employeeId: emp.emp_id,

          employeeD7: emp.emp_d7,
          /*employeeD4: emp.operationUnit.ou_name,
                    employeeD6: emp.functionalArea.fa_name,
                    employeeD5: emp.reportingEntity.re_name,*/

          employeeName: employeeSalaries[0].salary_emp_name,
          employeeUniqueId: employeeSalaries[0].salary_emp_unique_id,
          employeePaye: emp.emp_paye_no,
          location: locationName,
          jobRole: empJobRole,
          sector: sectorName,
          totalTax: totalTax,
          taxArray: taxArray,
          month: payrollMonth,
          year: payrollYear,
          adjustedGrossII: empAdjustedGrossII,
          adjustedGross: empAdjustedGross
        };
        employeeSalary.push(salaryObject);
      }
    }
    return res.status(200).json(employeeSalary);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/pause-salary', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      ps_empid: Joi.number().required()
    });

    const pauseSalaryRequest = req.body;
    const validationResult = schema.validate(pauseSalaryRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const existingSalary = await salary.getEmployeeSalary(payrollMonthYearData.pym_month, payrollMonthYearData.pym_year, pauseSalaryRequest.ps_empid);

    if (!_.isNull(existingSalary) || !_.isEmpty(existingSalary)) {
      return res.status(400).json(`Cannot Pause salary for employee with existing salary for current payroll month and year`);
    }

    const existingPauseSalaryData = pauseSalaryService.findExistingPauseSalary(
      pauseSalaryRequest.ps_empid,
      payrollMonthYearData.pym_month,
      payrollMonthYearData.pym_year
    );
    if (!_.isNull(existingPauseSalaryData) || !_.isEmpty(existingPauseSalaryData)) {
      return res.status(400).json(`Salary already paused for employee for selected month and year`);
    }

    await pauseSalaryService.addPauseSalary({
      ps_empid: pauseSalaryRequest.ps_empid,
      ps_month: payrollMonthYearData.pym_month,
      ps_year: payrollMonthYearData.pym_year,
      ps_created_by: req.user.username.user_id
    });

    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: 'Paused Salary',
      log_date: new Date()
    };
    await logs.addLog(logData);

    return res.status(200).json(`Salary paused for selected month and year`);
  } catch (err) {
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/unpause-salary', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      ps_id: Joi.number().required()
    });

    const pauseSalaryRequest = req.body;
    const validationResult = schema.validate(pauseSalaryRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const existingPauseSalaryData = await pauseSalaryService.findOnePauseSalary(pauseSalaryRequest.ps_id);
    if (_.isNull(existingPauseSalaryData) || _.isEmpty(existingPauseSalaryData)) {
      return res.status(400).json(`No paused salary found`);
    }

    const payrollMonth = parseInt(payrollMonthYearData.pym_month);
    const payrollYear = parseInt(payrollMonthYearData.pym_year);
    const existingPauseSalaryMonth = parseInt(existingPauseSalaryData.ps_month);
    const existingPauseSalaryYear = parseInt(existingPauseSalaryData.ps_year);
    const empId = parseInt(existingPauseSalaryData.ps_empid);

    if (existingPauseSalaryMonth !== payrollMonth || existingPauseSalaryYear !== payrollYear) {
      return res.status(400).json(`Cannot unpause salary for current non current payroll month and year `);
    }

    const existingSalary = await salary.getEmployeeSalary(payrollMonth, payrollYear, empId);

    if (!_.isNull(existingSalary) || !_.isEmpty(existingSalary)) {
      return res.status(400).json(`Cannot unpause salary for employee with existing salary for current payroll month and year`);
    }

    await pauseSalaryService.deletePauseSalary(pauseSalaryRequest.ps_id);

    return res.status(200).json(`Salary unpaused for selected month and year`);
  } catch (err) {
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.get('/pause-salary', auth(), async function (req, res, next) {
  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const existingPauseSalaryData = await pauseSalaryService.findPauseSalaryByMonthYear(
      payrollMonthYearData.pym_month,
      payrollMonthYearData.pym_year
    );

    return res.status(200).json(existingPauseSalaryData);
  } catch (err) {
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/reconciliation', auth(), async function (req, res, next) {
  const schema = Joi.object({
    r_location_id: Joi.number().required(),
    r_month: Joi.number().required(),
    r_year: Joi.number().required()
  });

  const reconciliationRequest = req.body;
  const validationResult = schema.validate(reconciliationRequest);

  if (validationResult.error) {
    return res.status(400).json(validationResult.error.details[0].message);
  }

  let location = parseInt(req.body.r_location_id);
  let month = parseInt(req.body.r_month);
  let year = parseInt(req.body.r_year);
  let comment = null;

  try {
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();

    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const salaryRoutineCheck = await salary.getSalaryMonthYear(month, year);

    if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
      return res.status(400).json(`Payroll Routine has not been run`);
    }

    const reconciliationRoutineCheck = await reconciliationService.getReconciliationMonthYearLocation(month, year, location);

    if (!_.isNull(reconciliationRoutineCheck) || !_.isEmpty(reconciliationRoutineCheck)) {
      return res.status(400).json(`Reconciliation has already been run for selected month and year and location`);
    }

    let employees = await salary.getDistinctEmployeesLocationMonthYear(month, year, location);
    employees = employees.map((emp) => {
      return { emp_id: emp.salary_empid };
    });

    if (_.isEmpty(employees) || _.isNull(employees)) {
      return res.status(400).json(`No Employees Selected Location`);
    }

    for (const emp of employees) {
      let grossSalary = 0;
      let netSalary = 0;
      let totalDeduction = 0;

      let previousGrossSalary = 0;
      let previousNetSalary = 0;
      let previousTotalDeduction = 0;

      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.emp_id);

      if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
        let empAdjustedGrossII = 0;
        let mainDeductions = 0;

        for (const empSalary of employeeSalaries) {
          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
            }
          } else {
            mainDeductions = parseFloat(empSalary.salary_amount) + mainDeductions;
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
              }
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
            }
          }
        }
        netSalary = grossSalary - mainDeductions;
      }

      //check if month is december and calculate pervious month
      let previousMonth = month;
      let previousYear = year;
      if (month === 1) {
        previousMonth = 12;
        previousYear = year - 1;
      } else {
        // month = month - 1;
      }

      let employeePreviousMonthSalaries = await salary.getEmployeeSalary(previousMonth, previousYear, emp.emp_id);
      if (!(_.isNull(employeePreviousMonthSalaries) || _.isEmpty(employeePreviousMonthSalaries))) {
        let empAdjustedGrossII = 0;
        let mainDeductions = 0;

        for (const empSalary of employeePreviousMonthSalaries) {
          // if (parseInt(empSalary.payment.pd_employee) === 1) {
          if (parseInt(empSalary.payment.pd_payment_type) === 1) {
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              previousGrossSalary = parseFloat(empSalary.salary_amount) + previousGrossSalary;
            }
          } else {
            mainDeductions = parseFloat(empSalary.salary_amount) + mainDeductions;
            if (parseInt(empSalary.payment.pd_employee) === 1) {
              if (parseInt(empSalary.payment.pd_total_gross_ii) === 0 && parseInt(empSalary.payment.pd_total_gross) === 0) {
                previousTotalDeduction = parseFloat(empSalary.salary_amount) + previousTotalDeduction;
              }
            }
          }

          if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
              empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount);
            }

            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
              empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount);
            }
          }
        }
        previousNetSalary = previousGrossSalary - mainDeductions;
      }

      let reconciliationObject = {
        r_employee_id: emp.emp_id,
        r_employee_t7: employeeSalaries[0].salary_emp_unique_id,
        r_employee_d7: employeeSalaries[0].salary_d7,
        r_employee_name: employeeSalaries[0].salary_emp_name,
        r_month: month,
        r_year: year,
        r_location_id: location,
        r_gross: grossSalary,
        r_net: netSalary,
        r_previous_net: previousNetSalary,
        r_previous_gross: previousGrossSalary,
        r_variance_net: netSalary - previousNetSalary,
        r_variance_gross: grossSalary - previousGrossSalary,
        r_comment: comment
      };

      await reconciliationService.addReconciliation(reconciliationObject);
    }

    await reconciliationService.addReconciliationMonthYearLocation({
      rmyl_month: month,
      rmyl_year: year,
      rmyl_location_id: location,
      rmyl_run_by: req.user.username.user_id,
      rmyl_comment: comment,
      rmyl_date: new Date()
    });

    return res.status(200).json('Reconciliation Run Successfully');
  } catch (err) {
    await reconciliationService.deleteReconciliation(month, year, location);
    await reconciliationService.deleteReconciliationMonthYearLocation(month, year, location);
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/pull-reconciliation', auth(), async function (req, res, next) {
  const schema = Joi.object({
    r_location_id: Joi.number().required(),
    r_month: Joi.number().required(),
    r_year: Joi.number().required()
  });

  const reconciliationRequest = req.body;
  const validationResult = schema.validate(reconciliationRequest);

  if (validationResult.error) {
    return res.status(400).json(validationResult.error.details[0].message);
  }

  let location = parseInt(req.body.r_location_id);
  let month = parseInt(req.body.r_month);
  let year = parseInt(req.body.r_year);

  try {
    const reconciliationRoutineCheck = await reconciliationService.getReconciliationMonthYearLocation(month, year, location);

    if (_.isNull(reconciliationRoutineCheck) || _.isEmpty(reconciliationRoutineCheck)) {
      return res.status(400).json(`Reconciliation has not been run for selected month and year and location`);
    }

    const reconciliationData = await reconciliationService.getReconciliationByMonthYearLocation(month, year, location);

    return res.status(200).json(reconciliationData);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.patch('/comment-reconciliation', auth(), async function (req, res, next) {
  const schema = Joi.object({
    r_id: Joi.number().required(),
    r_comment: Joi.string().required()
  });

  const reconciliationRequest = req.body;
  const validationResult = schema.validate(reconciliationRequest);

  if (validationResult.error) {
    return res.status(400).json(validationResult.error.details[0].message);
  }

  const reconciliationId = parseInt(req.body.r_id);
  const reconciliationComment = req.body.r_comment;

  try {
    const reconciliationData = await reconciliationService.getReconciliationById(reconciliationId);

    if (_.isNull(reconciliationData) || _.isEmpty(reconciliationData)) {
      return res.status(400).json(`Reconciliation not found`);
    }

    await reconciliationService.updateReconciliationComment(reconciliationId, reconciliationComment);

    return res.status(200).json('Reconciliation Comment Updated Successfully');
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});

router.post('/payment-request', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      month: Joi.number().required(),
      year: Joi.number().required(),
      location_id: Joi.number().required()
    });

    const paymentRequest = req.body;
    const validationResult = schema.validate(paymentRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }

    const month = paymentRequest.month;
    const year = paymentRequest.year;
    const locationId = paymentRequest.location_id;
    //check if payroll routine has been run

    let payrollRun = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(month, year);

    if (_.isEmpty(payrollRun) || _.isNull(payrollRun)) {
      return res.status(400).json(`Payroll Routine has not been run for any location`);
    }

    let payrollLocations = await payrollMonthYearLocation.findApprovedPayrollMonthYearLocationMonthYear(month, year);

    if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
      return res.status(400).json(`No Approved Payroll Routines`);
    }

    const locationData = await locationService.findLocationById(locationId);

    if (_.isEmpty(locationData) || _.isNull(locationData)) {
      return res.status(400).json(`Location not found`);
    }
    const employees = await salary.getDistinctEmployeesLocationMonthYear(month, year, locationId);

    if (_.isEmpty(employees) || _.isNull(employees)) {
      return res.status(400).json(`No employee in selected locations`);
    }

    let locationTotalGross = 0;
    let locationTotalGrossII = 0;
    let locationTotalGrossI = 0;
    let locationTotalDeduction = 0;
    let locationTotalEmployee = 0;
    let grossSalary = 0;
    let netSalary = 0;
    let totalDeduction = 0;

    for (const emp of employees) {
      let employeeSalaries = await salary.getEmployeeSalary(month, year, emp.salary_empid);
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
            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary;
          } else {
            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction;
          }
        }
        netSalary = grossSalary - totalDeduction;
      }
    }

    locationTotalGross = locationTotalGrossII + locationTotalGross;
    locationTotalDeduction = totalDeduction + locationTotalDeduction;
    let locationSalaryObject = {
      locationId: locationData.location_id,
      locationName: locationData.location_name,
      locationCode: locationData.location_t6_code,
      locationTotalGross: locationTotalGross,
      locationTotalDeduction: locationTotalDeduction,
      locationTotalNet: locationTotalGross - locationTotalDeduction,
      locationEmployeesCount: locationTotalEmployee,
      month: month,
      year: year
    };

    return res.status(200).json(locationSalaryObject);
  } catch (err) {
    console.log(err?.message);
    return res.status(400).json(JSON.stringify(err?.message));
    next(err);
  }
});

router.post('/salary-tes-routine', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      pmyl_location_id: Joi.number().required()
    });

    const payrollRequest = req.body;
    const validationResult = schema.validate(payrollRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();
    if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
      return res.status(400).json(`No payroll month and year set`);
    }
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;
    const employeeIdsLocation = [];
    let salaryObject = {};

    const employees = await employee.getActiveEmployeesByLocation(pmylLocationId);

    if (_.isEmpty(employees)) {
      return res.status(400).json('No Employees in Selected Location');
    }

    for (const emp of employees) {
      employeeIdsLocation.push(emp.emp_id);
    }

    // check for pending variational payments
    const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYearEmployees(
      payrollMonth,
      payrollYear,
      employeeIdsLocation
    );

    if (_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)) {
      //check if payroll routine has been run
      const salaryRoutineCheck = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, pmylLocationId);

      if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
        let GrossArray = [];

        for (const emp of employees) {
          let empGross = parseFloat(emp.emp_gross);

          let hiredDate = new Date(emp.emp_hire_date);
          let contractEndDate = new Date(emp.emp_contract_end_date);

          const contractEndYear = contractEndDate.getFullYear();
          const contractEndMonth = contractEndDate.getMonth() + 1;

          const hireYear = hiredDate.getFullYear();
          const hireMonth = hiredDate.getMonth() + 1;

          const payrollDate = new Date(parseInt(payrollYear), parseInt(payrollMonth) - 1, 2);
          let daysBeforeStart;
          if (hireYear === parseInt(payrollYear) && hireMonth === parseInt(payrollMonth)) {
            daysBeforeStart = await differenceInBusinessDays(hiredDate, payrollDate);
            empGross = empGross - (daysBeforeStart + 1) * (empGross / 22);
          }

          if (contractEndYear === parseInt(payrollYear) && contractEndMonth === parseInt(payrollMonth)) {
            // let suspendEmployee = await employee.suspendEmployee(emp.emp_id, 'Contract Ended').then((data) => {
            //     return data
            // })

            // let suspendUser = await user.suspendUser(emp.emp_unique_id).then((data) => {
            //     return data
            // })

            daysBeforeStart = await differenceInBusinessDays(contractEndDate, payrollDate);
            daysBeforeStart = 22 - (daysBeforeStart + 1);
            empGross = empGross - daysBeforeStart * (empGross / 22);
          }

          let cosObject = {
            name: `${emp.emp_first_name} ${emp.emp_last_name}`,
            gross: empGross
          };

          GrossArray.push(cosObject);

          //start
        }
        return res.status(200).json(GrossArray);
      } else {
        return res.status(400).json(`Payroll Routine has already been run for selected location`);
      }
    } else {
      return res.status(400).json(`There are pending Variational Payments`);
    }
  } catch (err) {
    const payrollRequest = req.body;
    const pmylLocationId = payrollRequest.pmyl_location_id;
    const employeeIdsLocation = [];
    const employees = await employee.getActiveEmployeesByLocation(pmylLocationId);

    for (const emp of employees) {
      employeeIdsLocation.push(emp.emp_id);
    }
    const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear();

    const payrollMonth = payrollMonthYearData.pym_month;
    const payrollYear = payrollMonthYearData.pym_year;

    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, pmylLocationId);
    return res.status(400).json(JSON.stringify(err?.message));
  }
});
/* run salary routine location */

router.get('/payslipemail', auth(), async function (req, res, next) {
  try {
    const templateParams = {
      monthYear: 'April 2022',
      name: 'Jane Doe',
      department: 'Engineering',
      jobRole: 'Full Stack Developer',
      employeeId: '3',
      monthNumber: '4',
      yearNumber: '2022'
    };

    const mailerRes = await mailer.paySlipSendMail('noreply@ircng.org', 'peterejiro96@gmail.com', 'Payslip Notification', templateParams);

    return res.status(200).json(mailerRes);
  } catch (err) {
    return res.status(400).json(err?.message);
  }
});

module.exports = router;

// DO While NOT rsA.EOF
// i = i + 1
// xBand = rsA("Band")
// xRate = rsA("Rate")
//
// If xTaxPay > 0 Then
// x_Diff = cdbl(x_TempPay) - cdbl(xBand)
//
// If x_Diff >= 0 Then
// 'If i <> 5 Then
// If i <> xTaxCount Then
// x_Percent = cdbl(xRate) * 0.01 * cdbl(xBand)
// Else
// x_Percent = cdbl(xRate) * 0.01 * cdbl(x_TempPay)
// End If
// Else
// x_Percent = cdbl(xRate) * 0.01 * cdbl(x_TempPay)
// x_PerTotal = cdbl(x_PerTotal) + cdbl(x_Percent)
// Exit Do
// End If
//
//
// Else
// x_Percent = cdbl(xTaxIncome) * cdbl(xSpecMinTax) * 0.01
//
// End If
//
//
// x_TempPay = cdbl(x_TempPay) - cdbl(xBand)
// x_PerTotal = cdbl(x_PerTotal) + cdbl(x_Percent)
//
// rsA.MoveNext
// Loop
