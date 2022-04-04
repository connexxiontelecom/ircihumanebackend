const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const salaryGrade = require('../services/salaryGradeService')
const salaryStructure = require('../services/salaryStructureService')
const paymentDefinition = require('../services/paymentDefinitionService')
const employee = require('../services/employeeService')
const user = require('../services/userService')
const locationAllowance = require('../services/locationAllowanceService')
const locationService = require('../services/locationService')
const salary = require('../services/salaryService')
const variationalPayment = require('../services/variationalPaymentService')
const payrollMonthYear = require('../services/payrollMonthYearService')
const payrollMonthYearLocation = require('../services/payrollMonthYearLocationService')
const taxRates = require('../services/taxRateService')
const minimumTaxRate = require('../services/minimumTaxRateService')
const {
    addLeaveAccrual,
    computeLeaveAccruals,
    removeLeaveAccrual,
    removeLeaveAccrualEmployees
} = require("../routes/leaveAccrual");
const leaveTypeService = require('../services/leaveTypeService');
const logs = require('../services/logService')
const {getTimeSheetDayEntry} = require("../services/timeSheetService");


/* run salary routine */
router.get('/salary-routine', auth, async function (req, res, next) {
    try {

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            let salaryObject = {}

            // check for pending variational payments
            const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)) {

                //check if payroll routine has been run
                const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                    return data
                })

                if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
                    const employees = await employee.getActiveEmployees().then((data) => {
                        return data
                    })

                    let GrossArray = []

                    for (const emp of employees) {

                        let empGross = parseFloat(emp.emp_gross)

                        let hiredDate = new Date(emp.emp_hire_date)
                        let contractEndDate = new Date(emp.emp_contract_end_date)

                        const contractEndYear = contractEndDate.getFullYear()
                        const contractEndMonth = contractEndDate.getMonth() + 1

                        const hireYear = hiredDate.getFullYear()
                        const hireMonth = hiredDate.getMonth() + 1

                        const payrollDate = new Date(parseInt(payrollYear), parseInt(payrollMonth) - 1, 2)
                        let daysBeforeStart
                        if ((hireYear === parseInt(payrollYear)) && (hireMonth === parseInt(payrollMonth))) {
                            daysBeforeStart = await differenceInBusinessDays(hiredDate, payrollDate)
                            empGross = empGross - ((daysBeforeStart + 1) * (empGross / 22))
                        }

                        if ((contractEndYear === parseInt(payrollYear)) && (contractEndMonth === parseInt(payrollMonth))) {
                            let suspendEmployee = await employee.suspendEmployee(emp.emp_id, 'Contract Ended').then((data) => {
                                return data
                            })

                            let suspendUser = await user.suspendUser(emp.emp_unique_id).then((data) => {
                                return data
                            })

                            daysBeforeStart = await differenceInBusinessDays(contractEndDate, payrollDate)
                            daysBeforeStart = 22 - (daysBeforeStart + 1)
                            empGross = empGross - (daysBeforeStart * (empGross / 22))
                        }

                        if (empGross > 0) {
                            //check employee variational payments
                            const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(emp.emp_id, payrollMonth, payrollYear).then((data) => {
                                return data
                            })

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
                                    }

                                    let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`An error Occurred while Processing Routine variational payments `)

                                        })

                                    }


                                }
                            }

                            const grossPercentage = await paymentDefinition.findCodeWithGross().then((data) => {
                                return data
                            })
                            if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {

                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                    return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)

                                })

                            } else {

                                const totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) => {
                                    return data
                                })

                                if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                        return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)
                                    })
                                } else {
                                    let amount = 0;
                                    let percent = 0;

                                    let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition().then((data) => {
                                        return data
                                    })
                                    let basicSalaryPercent = parseFloat(paymentDefinitionData.pd_pr_gross)

                                    //  splitting into percentages

                                    for (const percentage of grossPercentage) {
                                        percent = parseFloat(percentage.pd_pr_gross)
                                        amount = (percent / 100) * empGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: percentage.pd_id,
                                            salary_amount: amount,
                                            salary_share: percent,
                                            salary_tax: 0
                                        }


                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine splitting gross `)

                                            })

                                        }

                                    }


                                    // hazard allowances
                                    const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(emp.emp_location_id).then((data) => {
                                        return data
                                    })

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
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine hazard allowance `)

                                                })

                                            }


                                        }
                                    }


                                    //computational Payments

                                    const computationalPayments = await paymentDefinition.getComputedPayments().then((data) => {
                                        return data
                                    })

                                    let fullGross = 0;
                                    let empAdjustedGross = 0
                                    let empAdjustedGrossII = 0;

                                    let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                                        return data
                                    })


                                    for (const salary of fullSalaryData) {
                                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                                            fullGross = parseFloat(salary.salary_amount) + fullGross
                                        }


                                        if (parseInt(salary.payment.pd_total_gross) === 1) {
                                            if (parseInt(salary.payment.pd_payment_type) === 1) {
                                                empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount)

                                            }

                                            if (parseInt(salary.payment.pd_payment_type) === 2) {
                                                empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount)

                                            }

                                        }

                                        if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
                                            if (parseInt(salary.payment.pd_payment_type) === 1) {
                                                empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount)

                                            }

                                            if (parseInt(salary.payment.pd_payment_type) === 2) {
                                                empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount)

                                            }

                                        }
                                    }


                                    let basicFullGross = (basicSalaryPercent / 100) * fullGross

                                    let basicAdjustedGross = (basicSalaryPercent / 100) * empAdjustedGross;

                                    for (const computationalPayment of computationalPayments) {

                                        //adjusted gross computation
                                        if (parseInt(computationalPayment.pd_amount) === 1) {

                                            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)
                                                })

                                            }
                                        }


                                        //adjusted gross basic computation
                                        if (parseInt(computationalPayment.pd_amount) === 2) {
                                            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicAdjustedGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine basic computation `)

                                                })

                                            }

                                        }


                                        // Full Gross
                                        if (parseInt(computationalPayment.pd_amount) === 3) {

                                            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * fullGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }


                                        // Full basic Gross
                                        if (parseInt(computationalPayment.pd_amount) === 4) {

                                            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicFullGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }

                                        //adjusted gross II
                                        if (parseInt(computationalPayment.pd_amount) === 5) {

                                            amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGrossII

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                                return data
                                            })

                                            if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }
                                    }

                                    //tax computation
                                    let welfareIncomes = 0;
                                    let taxableIncome = 0;
                                    let taxableIncomeData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                                        return data
                                    })

                                    for (const income of taxableIncomeData) {
                                        if ((parseInt(income.payment.pd_payment_type) === 1) && (parseInt(income.payment.pd_payment_taxable) === 1)) {
                                            taxableIncome = parseFloat(income.salary_amount) + taxableIncome
                                        }

                                        if (parseInt(income.payment.pd_welfare) === 1) {
                                            welfareIncomes = welfareIncomes + parseFloat(income.salary_amount)
                                        }

                                    }


                                    let taxRatesData = await taxRates.findAllTaxRate().then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`No tax Rate Setup `)

                                        })

                                    }
                                    let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate().then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`Minimum Tax Rate Not Setup `)

                                        })
                                    }


                                    let paymentDefinitionTaxData = await paymentDefinition.findTax().then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`No Payment Definition has been Indicated as Tax `)

                                        })
                                    }
                                    let newTaxableIncome = empAdjustedGrossII - welfareIncomes
                                    let checka = parseFloat(200000 / 12)
                                    let checkb = parseFloat((1 / 100) * empAdjustedGrossII)
                                    let allowableSum = checka
                                    if (checkb > checka) {
                                        allowableSum = checkb
                                    }
                                    let taxRelief = ((20 / 100) * empAdjustedGrossII) + (allowableSum)
                                    let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * (empAdjustedGrossII);
                                    let tempTaxAmount = newTaxableIncome - taxRelief
                                    let TtempTaxAmount = tempTaxAmount
                                    let cTax;
                                    let totalTaxAmount = 0;
                                    let i = 1;

                                    let taxObjects = []
                                    if (parseFloat(tempTaxAmount) > 0) {
                                        for (const tax of taxRatesData) {
                                            if (i < parseInt(taxRatesData.length)) {
                                                if ((tempTaxAmount - tax.tr_band / 12) > 0) {

                                                    if (tempTaxAmount >= tax.tr_band / 12) {
                                                        cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
                                                        let taxObject = {
                                                            band: tax.tr_band / 12,
                                                            rate: tax.tr_rate,
                                                            amount: cTax
                                                        }
                                                        taxObjects.push(taxObject)
                                                    } else {
                                                        cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                                        totalTaxAmount = cTax + totalTaxAmount
                                                        let taxObject = {
                                                            band: tax.tr_band / 12,
                                                            rate: tax.tr_rate,
                                                            amount: cTax
                                                        }
                                                        taxObjects.push(taxObject)
                                                        break;
                                                    }

                                                } else {
                                                    cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                                    totalTaxAmount = cTax + totalTaxAmount
                                                    let taxObject = {
                                                        band: tax.tr_band / 12,
                                                        rate: tax.tr_rate,
                                                        amount: cTax
                                                    }
                                                    taxObjects.push(taxObject)
                                                    break;
                                                }


                                            } else {
                                                cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                                let taxObject = {
                                                    band: tax.tr_band / 12,
                                                    rate: tax.tr_rate,
                                                    amount: cTax
                                                }
                                                taxObjects.push(taxObject)

                                            }
                                            tempTaxAmount = tempTaxAmount - (tax.tr_band / 12);

                                            totalTaxAmount = cTax + totalTaxAmount
                                            i++;
                                        }

                                        if (totalTaxAmount <= minimumTax) {
                                            totalTaxAmount = minimumTax
                                        }

                                    } else {
                                        totalTaxAmount = minimumTax
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

                                    }

                                    salaryObject = {
                                        salary_empid: emp.emp_id,
                                        salary_paymonth: payrollMonth,
                                        salary_payyear: payrollYear,
                                        salary_pd: paymentDefinitionTaxData.pd_id,
                                        salary_amount: totalTaxAmount,
                                        salary_share: 0,
                                        salary_tax: 1
                                    }

                                    let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                        })

                                    }

                                    const leaveTypesData = await leaveTypeService.getAccruableLeaves().then((data) => {
                                        return data
                                    })

                                    if (_.isNull(leaveTypesData) || _.isEmpty(leaveTypesData)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`An error Occurred while Processing No Leave type to accrue for Employees `)

                                        })
                                    }

                                    for (const leaveType of leaveTypesData) {
                                        const leaveAccrual = {
                                            lea_emp_id: emp.emp_id,
                                            lea_month: payrollMonth,
                                            lea_year: payrollYear,
                                            lea_leave_type: leaveType.leave_type_id,
                                            lea_rate: parseFloat(leaveType.lt_rate)
                                        }

                                        const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(addAccrualResponse) || _.isNull(addAccrualResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Leave Accruing Error `)

                                            })
                                        }
                                    }

                                    let grossObject = {
                                        empGross, empAdjustedGross
                                    }

                                    GrossArray.push(grossObject)
                                }


                            }

                        }

                    }

                    //return  res.status(200).json(GrossArray)
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Ran Payroll Routine",
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes) => {

                        return res.status(200).json('Action Successful')
                    })

                } else {

                    return res.status(400).json(`Payroll Routine has already been run`)
                }


            } else {

                return res.status(400).json(`There are pending Variational Payments`)
            }

        }

    } catch (err) {
        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year

        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            console.log(err.message)
            next(err);
        })

    }
});

/* run salary routine location */
router.post('/salary-routine', auth, async function (req, res, next) {
    try {

        const schema = Joi.object({
            pmyl_location_id: Joi.number().required(),
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        }
        const pmylLocationId = payrollRequest.pmyl_location_id
        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year
        const employeeIdsLocation = []
        let salaryObject = {}

        const employees = await employee.getActiveEmployeesByLocation(pmylLocationId).then((data) => {
            return data
        })

        if (_.isEmpty(employees)) {
            return res.status(400).json('No Employees in Selected Location')
        }

        for (const emp of employees) {
            employeeIdsLocation.push(emp.emp_id)
        }

        // check for pending variational payments
        const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYearEmployees(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
            return data
        })


        if (_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)) {

            //check if payroll routine has been run
            const salaryRoutineCheck = await payrollMonthYearLocation.findPayrollByMonthYearLocation(payrollMonth, payrollYear, pmylLocationId).then((data) => {
                return data
            })


            if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

                let GrossArray = []

                for (const emp of employees) {

                    let empGross = parseFloat(emp.emp_gross)

                    let hiredDate = new Date(emp.emp_hire_date)
                    let contractEndDate = new Date(emp.emp_contract_end_date)

                    const contractEndYear = contractEndDate.getFullYear()
                    const contractEndMonth = contractEndDate.getMonth() + 1

                    const hireYear = hiredDate.getFullYear()
                    const hireMonth = hiredDate.getMonth() + 1

                    const payrollDate = new Date(parseInt(payrollYear), parseInt(payrollMonth) - 1, 2)
                    let daysBeforeStart
                    if ((hireYear === parseInt(payrollYear)) && (hireMonth === parseInt(payrollMonth))) {
                        daysBeforeStart = await differenceInBusinessDays(hiredDate, payrollDate)
                        empGross = empGross - ((daysBeforeStart + 1) * (empGross / 22))
                    }

                    if ((contractEndYear === parseInt(payrollYear)) && (contractEndMonth === parseInt(payrollMonth))) {
                        let suspendEmployee = await employee.suspendEmployee(emp.emp_id, 'Contract Ended').then((data) => {
                            return data
                        })

                        let suspendUser = await user.suspendUser(emp.emp_unique_id).then((data) => {
                            return data
                        })

                        daysBeforeStart = await differenceInBusinessDays(contractEndDate, payrollDate)
                        daysBeforeStart = 22 - (daysBeforeStart + 1)
                        empGross = empGross - (daysBeforeStart * (empGross / 22))
                    }

                    if (empGross > 0) {
                        //check employee variational payments
                        const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(emp.emp_id, payrollMonth, payrollYear).then((data) => {
                            return data
                        })

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
                                }

                                let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                    return data
                                })

                                if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`An error Occurred while Processing Routine variational payments `)

                                    })

                                }


                            }
                        }

                        const grossPercentage = await paymentDefinition.findCodeWithGross().then((data) => {
                            return data
                        })
                        if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {

                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)

                            })

                        } else {

                            const totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) => {
                                return data
                            })

                            if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                    return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)
                                })
                            } else {
                                let amount = 0;
                                let percent = 0;

                                let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition().then((data) => {
                                    return data
                                })
                                let basicSalaryPercent = parseFloat(paymentDefinitionData.pd_pr_gross)

                                //  splitting into percentages

                                for (const percentage of grossPercentage) {
                                    percent = parseFloat(percentage.pd_pr_gross)
                                    amount = (percent / 100) * empGross

                                    salaryObject = {
                                        salary_empid: emp.emp_id,
                                        salary_paymonth: payrollMonth,
                                        salary_payyear: payrollYear,
                                        salary_pd: percentage.pd_id,
                                        salary_amount: amount,
                                        salary_share: percent,
                                        salary_tax: 0
                                    }


                                    let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                                            return res.status(400).json(`An error Occurred while Processing Routine splitting gross `)

                                        })

                                    }

                                }


                                // hazard allowances
                                const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(emp.emp_location_id).then((data) => {
                                    return data
                                })

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
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine hazard allowance `)

                                            })

                                        }


                                    }
                                }


                                //computational Payments

                                const computationalPayments = await paymentDefinition.getComputedPayments().then((data) => {
                                    return data
                                })

                                let fullGross = 0;
                                let empAdjustedGross = 0
                                let empAdjustedGrossII = 0;

                                let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                                    return data
                                })


                                for (const salary of fullSalaryData) {
                                    if (parseInt(salary.payment.pd_payment_type) === 1) {
                                        fullGross = parseFloat(salary.salary_amount) + fullGross
                                    }


                                    if (parseInt(salary.payment.pd_total_gross) === 1) {
                                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                                            empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount)

                                        }

                                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                                            empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount)

                                        }

                                    }

                                    if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
                                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                                            empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount)

                                        }

                                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                                            empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount)

                                        }

                                    }
                                }


                                let basicFullGross = (basicSalaryPercent / 100) * fullGross

                                let basicAdjustedGross = (basicSalaryPercent / 100) * empAdjustedGross;

                                for (const computationalPayment of computationalPayments) {

                                    //adjusted gross computation
                                    if (parseInt(computationalPayment.pd_amount) === 1) {

                                        amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: computationalPayment.pd_id,
                                            salary_amount: amount,
                                            salary_share: 0,
                                            salary_tax: 0
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine gross computation `)
                                            })

                                        }
                                    }


                                    //adjusted gross basic computation
                                    if (parseInt(computationalPayment.pd_amount) === 2) {
                                        amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicAdjustedGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: computationalPayment.pd_id,
                                            salary_amount: amount,
                                            salary_share: 0,
                                            salary_tax: 0
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine basic computation `)

                                            })

                                        }

                                    }


                                    // Full Gross
                                    if (parseInt(computationalPayment.pd_amount) === 3) {

                                        amount = (parseFloat(computationalPayment.pd_percentage) / 100) * fullGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: computationalPayment.pd_id,
                                            salary_amount: amount,
                                            salary_share: 0,
                                            salary_tax: 0
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                            })

                                        }
                                    }


                                    // Full basic Gross
                                    if (parseInt(computationalPayment.pd_amount) === 4) {

                                        amount = (parseFloat(computationalPayment.pd_percentage) / 100) * basicFullGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: computationalPayment.pd_id,
                                            salary_amount: amount,
                                            salary_share: 0,
                                            salary_tax: 0
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                            })

                                        }
                                    }

                                    //adjusted gross II
                                    if (parseInt(computationalPayment.pd_amount) === 5) {

                                        amount = (parseFloat(computationalPayment.pd_percentage) / 100) * empAdjustedGrossII

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: computationalPayment.pd_id,
                                            salary_amount: amount,
                                            salary_share: 0,
                                            salary_tax: 0
                                        }

                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                            return data
                                        })

                                        if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                                return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                            })

                                        }
                                    }
                                }

                                //tax computation
                                let welfareIncomes = 0;
                                let taxableIncome = 0;
                                let taxableIncomeData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                                    return data
                                })

                                for (const income of taxableIncomeData) {
                                    if ((parseInt(income.payment.pd_payment_type) === 1) && (parseInt(income.payment.pd_payment_taxable) === 1)) {
                                        taxableIncome = parseFloat(income.salary_amount) + taxableIncome
                                    }

                                    if (parseInt(income.payment.pd_welfare) === 1) {
                                        welfareIncomes = welfareIncomes + parseFloat(income.salary_amount)
                                    }

                                }


                                let taxRatesData = await taxRates.findAllTaxRate().then((data) => {
                                    return data
                                })

                                if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`No tax Rate Setup `)

                                    })

                                }
                                let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate().then((data) => {
                                    return data
                                })

                                if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`Minimum Tax Rate Not Setup `)

                                    })
                                }


                                let paymentDefinitionTaxData = await paymentDefinition.findTax().then((data) => {
                                    return data
                                })

                                if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`No Payment Definition has been Indicated as Tax `)

                                    })
                                }
                                let newTaxableIncome = empAdjustedGrossII - welfareIncomes
                                let checka = parseFloat(200000 / 12)
                                let checkb = parseFloat((1 / 100) * empAdjustedGrossII)
                                let allowableSum = checka
                                if (checkb > checka) {
                                    allowableSum = checkb
                                }
                                let taxRelief = ((20 / 100) * empAdjustedGrossII) + (allowableSum)
                                let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * (empAdjustedGrossII);
                                let tempTaxAmount = newTaxableIncome - taxRelief
                                let TtempTaxAmount = tempTaxAmount
                                let cTax;
                                let totalTaxAmount = 0;
                                let i = 1;

                                let taxObjects = []
                                if (parseFloat(tempTaxAmount) > 0) {
                                    for (const tax of taxRatesData) {
                                        if (i < parseInt(taxRatesData.length)) {
                                            if ((tempTaxAmount - tax.tr_band / 12) > 0) {

                                                if (tempTaxAmount >= tax.tr_band / 12) {
                                                    cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
                                                    let taxObject = {
                                                        band: tax.tr_band / 12,
                                                        rate: tax.tr_rate,
                                                        amount: cTax
                                                    }
                                                    taxObjects.push(taxObject)
                                                } else {
                                                    cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                                    totalTaxAmount = cTax + totalTaxAmount
                                                    let taxObject = {
                                                        band: tax.tr_band / 12,
                                                        rate: tax.tr_rate,
                                                        amount: cTax
                                                    }
                                                    taxObjects.push(taxObject)
                                                    break;
                                                }

                                            } else {
                                                cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                                totalTaxAmount = cTax + totalTaxAmount
                                                let taxObject = {
                                                    band: tax.tr_band / 12,
                                                    rate: tax.tr_rate,
                                                    amount: cTax
                                                }
                                                taxObjects.push(taxObject)
                                                break;
                                            }


                                        } else {
                                            cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                                            let taxObject = {
                                                band: tax.tr_band / 12,
                                                rate: tax.tr_rate,
                                                amount: cTax
                                            }
                                            taxObjects.push(taxObject)

                                        }
                                        tempTaxAmount = tempTaxAmount - (tax.tr_band / 12);

                                        totalTaxAmount = cTax + totalTaxAmount
                                        i++;
                                    }

                                    if (totalTaxAmount <= minimumTax) {
                                        totalTaxAmount = minimumTax
                                    }

                                } else {
                                    totalTaxAmount = minimumTax
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

                                }

                                salaryObject = {
                                    salary_empid: emp.emp_id,
                                    salary_paymonth: payrollMonth,
                                    salary_payyear: payrollYear,
                                    salary_pd: paymentDefinitionTaxData.pd_id,
                                    salary_amount: totalTaxAmount,
                                    salary_share: 0,
                                    salary_tax: 1
                                }

                                let salaryAddResponse = await salary.addSalary(salaryObject).then((data) => {
                                    return data
                                })

                                if (_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                    })

                                }

                                const leaveTypesData = await leaveTypeService.getAccruableLeaves().then((data) => {
                                    return data
                                })

                                if (_.isNull(leaveTypesData) || _.isEmpty(leaveTypesData)) {
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                        return res.status(400).json(`An error Occurred while Processing No Leave type to accrue for Employees `)

                                    })
                                }

                                for (const leaveType of leaveTypesData) {
                                    const leaveAccrual = {
                                        lea_emp_id: emp.emp_id,
                                        lea_month: payrollMonth,
                                        lea_year: payrollYear,
                                        lea_leave_type: leaveType.leave_type_id,
                                        lea_rate: parseFloat(leaveType.lt_rate)
                                    }

                                    const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
                                        return data
                                    })

                                    if (_.isEmpty(addAccrualResponse) || _.isNull(addAccrualResponse)) {
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
                                            return res.status(400).json(`An error Occurred while Processing Leave Accruing Error `)

                                        })
                                    }
                                }

                                // let grossObject = {
                                //     empGross, empAdjustedGross
                                // }

                                // GrossArray.push(grossObject)
                            }


                        }

                    }


                    //start
                }

                const pmylObject = {
                    pmyl_month: payrollMonth,
                    pmyl_year: payrollYear,
                    pmyl_location_id: pmylLocationId
                }

                await payrollMonthYearLocation.addPayrollMonthYearLocation(pmylObject).then((data) => {
                    return data
                })

                //return  res.status(200).json(GrossArray)
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Ran Payroll Routine",
                    "log_date": new Date()
                }
                await logs.addLog(logData).then((logRes) => {

                    return res.status(200).json('Action Successful')
                })

            } else {

                return res.status(400).json(`Payroll Routine has already been run for selected location`)
            }


        } else {

            return res.status(400).json(`There are pending Variational Payments`)
        }

    } catch (err) {

        const payrollRequest = req.body
        const pmylLocationId = payrollRequest.pmyl_location_id
        const employeeIdsLocation = []
        const employees = await employee.getActiveEmployeesByLocation(pmylLocationId).then((data) => {
            return data
        })

        for (const emp of employees) {
            employeeIdsLocation.push(emp.emp_id)
        }
        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year

        await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
            console.log(err.message)
            next(err);
        })

    }
});


/* check payroll routine */
router.get('/check-salary-routine', auth, async function (req, res, next) {
    try {

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (!(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck))) {
                return res.status(400).json(`Payroll Routine has already been run`)
            } else {
                return res.status(200).json(`Payroll Routine has not been run`)
            }

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* undo salary */
router.get('/undo-salary-routine', auth, async function (req, res, next) {
    try {

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year

        const salaryRoutineUndo = await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        const leaveAccrualData = {
            lea_month: payrollMonth,
            lea_year: payrollYear,
        }
        const leaveAccrualsUndo = await removeLeaveAccrual(leaveAccrualData).then((data) => {
            return data
        })

        const reverseVariationalPayments = await variationalPayment.undoVariationalPaymentMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Undo Payroll Routine",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes) => {

            return res.status(200).json('Action Successful')
        })


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/undo-salary-routine', auth, async function (req, res, next) {
    try {

        const schema = Joi.object({
            pmyl_location_id: Joi.number().required(),
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const pmylLocationId = payrollRequest.pmyl_location_id
        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year
        const employeeIdsLocation = []
        if (parseInt(pmylLocationId) > 0) {
            await payrollMonthYearLocation.removePayrollMonthYearLocation(payrollMonth, payrollYear, pmylLocationId).then((data) => {
                return data
            })

            const employees = await employee.getActiveEmployeesByLocation(pmylLocationId).then((data) => {
                return data
            })

            for (const emp of employees) {
                employeeIdsLocation.push(emp.emp_id)
            }
        } else {
            await payrollMonthYearLocation.removePayrollMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })
            const employees = await employee.getActiveEmployees().then((data) => {
                return data
            })

            for (const emp of employees) {
                employeeIdsLocation.push(emp.emp_id)
            }
        }


        const salaryRoutineUndo = await salary.undoSalaryMonthYear(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
            return data
        })

        const leaveAccrualData = {
            lea_month: payrollMonth,
            lea_year: payrollYear,
            lea_emp_id: employeeIdsLocation
        }
        const leaveAccrualsUndo = await removeLeaveAccrualEmployees(leaveAccrualData).then((data) => {
            return data
        })

        const reverseVariationalPayments = await variationalPayment.undoVariationalPaymentMonthYearEmployee(payrollMonth, payrollYear, employeeIdsLocation).then((data) => {
            return data
        })

        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Undo Payroll Routine",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes) => {

            return res.status(200).json('Action Successful')
        })


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* fetch salary */
router.get('/pull-salary-routine', auth, async function (req, res, next) {
    try {


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = []
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

                return res.status(400).json(`Payroll Routine has not been run`)


            } else {

                const employees = await employee.getActiveEmployees().then((data) => {
                    return data
                })

                for (const emp of employees) {

                    let grossSalary = 0
                    let netSalary = 0
                    let totalDeduction = 0

                    let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                        return data
                    })

                    if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
                        for (const empSalary of employeeSalaries) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            } else {
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }
                        netSalary = grossSalary - totalDeduction
                        let empJobRole = 'N/A'
                        // if(parseInt(emp.emp_job_role_id) > 0){
                        //     empJobRole = emp.jobRole.job_role
                        // }

                        let sectorName = 'N/A'
                        if (parseInt(emp.emp_department_id) > 0) {
                            sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
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
                        }

                        employeeSalary.push(salaryObject)

                    }

                }
                return res.status(200).json(employeeSalary)
            }

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* fetch salary */
router.get('/pull-salary-routine-locations', auth, async function (req, res, next) {
    try {


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let payrollLocations = await payrollMonthYearLocation.findPayrollMonthYearLocationMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isEmpty(payrollLocations) || _.isNull(payrollLocations)) {
                return res.status(400).json(`Payroll Routine has not been run for any location`)
            }

            let locationSalaryArray = []
            for (const location of payrollLocations) {

                const locationData = await locationService.findLocationById(location.pmyl_location_id).then((data)=>{
                    return data
                })

                if(!(_.isEmpty(locationData))){

                    const employees = await employee.getActiveEmployeesByLocation(location.pmyl_location_id).then((data) => {
                        return data
                    })



                    if (_.isEmpty(employees) || _.isNull(employees)) {
                        return res.status(400).json(`No employee in selected locations`)
                    }

                    let locationTotalGross = 0
                    let locationTotalDeduction = 0
                    let locationTotalNetPay = 0
                    let locationTotalEmployee = employees.length
                    let grossSalary = 0
                    let netSalary = 0
                    let totalDeduction = 0

                    for (const emp of employees) {
                        let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                            return data
                        })
                        if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
                            for (const empSalary of employeeSalaries) {
                                if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                    grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                                } else {
                                    totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                                }
                            }
                            netSalary = grossSalary - totalDeduction
                            let empJobRole = 'N/A'
                            // if(parseInt(emp.emp_job_role_id) > 0){
                            //     empJobRole = emp.jobRole.job_role
                            // }

                            let sectorName = 'N/A'
                            if (parseInt(emp.emp_department_id) > 0) {
                                sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
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
                            }
                        }
                    }

                    locationTotalGross = grossSalary + locationTotalGross
                    locationTotalDeduction = totalDeduction + locationTotalDeduction

                    let locationSalaryObject={
                        locationId: locationData.location_id,
                        locationName: locationData.location_name,
                        locationCode: locationData.location_t6_code,
                        locationTotalGross: locationTotalGross,
                        locationTotalDeduction: locationTotalDeduction,
                        locationTotalNet: locationTotalGross - locationTotalDeduction,
                        locationEmployeesCount: locationTotalEmployee,
                        month: payrollMonth,
                        year: payrollYear

                    }

                    locationSalaryArray.push(locationSalaryObject)
                }



            }
            return res.status(200).json(locationSalaryArray)

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.get('/pull-emolument/:locationId', auth, async function (req, res, next) {
    try {
        const pmylLocationId = parseInt(req.params.locationId)

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        }
        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
            return res.status(400).json(`Payroll Routine has not been run`)

        } else {

            let employees = []
            if (pmylLocationId === 0) {
                employees = await employee.getActiveEmployees().then((data) => {
                    return data
                })
            } else {
                employees = await employee.getActiveEmployeesByLocation(pmylLocationId).then((data) => {
                    return data
                })
            }

            if (_.isEmpty(employees) || _.isNull(employees)) {
                return res.status(400).json(`No Employees Selected Location`)
            }

            for (const emp of employees) {

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0

                let deductions = []
                let incomes = []

                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                    for (const empSalary of employeeSalaries) {
                        if (parseInt(empSalary.payment.pd_employee) === 1) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                const incomeDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                incomes.push(incomeDetails)
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            } else {
                                const deductionDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                deductions.push(deductionDetails)
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }


                    }
                    netSalary = grossSalary - totalDeduction

                    let empJobRole = 'N/A'
                    if (parseInt(emp.emp_job_role_id) > 0) {
                        empJobRole = emp.jobrole.job_role
                    }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
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
                        netSalary: netSalary,
                        incomes: incomes,
                        deductions: deductions,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/pull-salary-routine', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year

        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)


        } else {

            const employees = await employee.getActiveEmployees().then((data) => {
                return data
            })

            for (const emp of employees) {

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0

                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
                    for (const empSalary of employeeSalaries) {
                        if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                        } else {
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }
                    netSalary = grossSalary - totalDeduction

                    let empJobRole = 'N/A'
                    if (parseInt(emp.emp_job_role_id) > 0) {
                        empJobRole = emp.jobrole.job_role
                    }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
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
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/approve-salary-routine', auth, async function (req, res, next) {
    try {


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = []
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

                return res.status(400).json(`Payroll Routine has not been run`)


            } else {
                let today = new Date();
                let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();


                const approveResponse = await salary.approveSalary(payrollMonth, payrollYear, req.user.username.user_id, date).then((data) => {
                    return data
                })

                if (!(_.isEmpty(approveResponse) || _.isNull(approveResponse))) {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": `approved payroll routine for ${payrollMonth} - ${payrollYear}`,
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes) => {
                        return res.status(200).json(`Payroll Approved`)
                    })
                }

            }

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/confirm-salary-routine', auth, async function (req, res, next) {
    try {


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = []
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

                return res.status(400).json(`Payroll Routine has not been run`)
            } else {
                let today = new Date();
                let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();


                const confirmResponse = await salary.confirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date).then((data) => {
                    return data
                })

                if (!(_.isEmpty(confirmResponse) || _.isNull(confirmResponse))) {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": `Confirmed payroll routine for ${payrollMonth} - ${payrollYear}`,
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes) => {
                        return res.status(200).json(`Payroll Confirmed`)
                    })
                }

            }

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/pull-salary-routine/:empId', auth, async function (req, res, next) {
    try {

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return data
        })
        if (_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)) {
            return res.status(400).json(`No payroll month and year set`)
        } else {
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run

            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return data
            })

            if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

                return res.status(400).json(`Payroll Routine has not been run`)
            } else {
                const emp = await employee.getEmployee(parseInt(req.params.empId)).then((data) => {
                    return data
                })

                if (_.isEmpty(emp) || _.isNull(emp)) {
                    return res.status(400).json(`Employee Doesnt Exist`)
                }

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0
                let deductions = []
                let incomes = []
                let employersIncomes = []
                let employersDeductions = []
                let empAdjustedGross = 0
                let empAdjustedGrossII = 0


                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                    for (const empSalary of employeeSalaries) {


                        if (parseInt(empSalary.payment.pd_employee) === 1) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                const incomeDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                incomes.push(incomeDetails)
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary

                                if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                                    empAdjustedGross = empAdjustedGross + parseFloat(empSalary.salary_amount)

                                }


                                if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                                    empAdjustedGrossII = empAdjustedGrossII + parseFloat(empSalary.salary_amount)
                                }

                            } else {
                                const deductionDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                deductions.push(deductionDetails)
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                                if (parseInt(empSalary.payment.pd_total_gross) === 1) {
                                    empAdjustedGross = empAdjustedGross - parseFloat(empSalary.salary_amount)
                                }
                                if (parseInt(empSalary.payment.pd_total_gross_ii) === 1) {
                                    empAdjustedGrossII = empAdjustedGrossII - parseFloat(empSalary.salary_amount)
                                }
                            }
                        }

                        if (parseInt(empSalary.payment.pd_employee) === 2) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                const incomeDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                employersIncomes.push(incomeDetails)

                            } else {
                                const deductionDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                employersDeductions.push(deductionDetails)

                            }
                        }

                    }
                    netSalary = grossSalary - totalDeduction

                    let empJobRole = 'N/A'
                    if (parseInt(emp.emp_job_role_id) > 0) {
                        empJobRole = emp.jobrole.job_role
                    }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                    }

                    let employeeSalary = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole: empJobRole,
                        sector: sectorName,
                        grossSalary: grossSalary,
                        nsitf: (1 / 100) * empAdjustedGrossII,
                        pension: (10 / 100) * empAdjustedGrossII,
                        employersDeductions: employersDeductions,
                        employersIncomes: employersIncomes,
                        totalDeduction: totalDeduction,
                        netSalary: netSalary,
                        incomes: incomes,
                        deductions: deductions,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    return res.status(200).json(employeeSalary)

                } else {
                    return res.status(200).json(`No Salary for Employee`)
                }


            }

        }

    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.post('/pull-salary-routine/:empId', auth, async function (req, res, next) {
    try {

        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run

        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)
        } else {
            const emp = await employee.getEmployee(parseInt(req.params.empId)).then((data) => {
                return data
            })

            if (_.isEmpty(emp) || _.isNull(emp)) {
                return res.status(400).json(`Employee Doesnt Exist`)
            }

            let grossSalary = 0
            let netSalary = 0
            let totalDeduction = 0
            let deductions = []
            let incomes = []
            let employersIncomes = []
            let employersDeductions = []

            let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                return data
            })

            if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                for (const empSalary of employeeSalaries) {
                    if (parseInt(empSalary.payment.pd_employee) === 1) {
                        if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                            const incomeDetails = {
                                paymentName: empSalary.payment.pd_payment_name,
                                amount: empSalary.salary_amount
                            }
                            incomes.push(incomeDetails)
                            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                        } else {
                            const deductionDetails = {
                                paymentName: empSalary.payment.pd_payment_name,
                                amount: empSalary.salary_amount
                            }
                            deductions.push(deductionDetails)
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }

                    if (parseInt(empSalary.payment.pd_employee) === 2) {
                        if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                            const incomeDetails = {
                                paymentName: empSalary.payment.pd_payment_name,
                                amount: empSalary.salary_amount
                            }
                            employersIncomes.push(incomeDetails)

                        } else {
                            const deductionDetails = {
                                paymentName: empSalary.payment.pd_payment_name,
                                amount: empSalary.salary_amount
                            }
                            employersDeductions.push(deductionDetails)

                        }
                    }

                }
                netSalary = grossSalary - totalDeduction

                let empJobRole = 'N/A'
                if (parseInt(emp.emp_job_role_id) > 0) {
                    empJobRole = emp.jobrole.job_role
                }

                let sectorName = 'N/A'
                if (parseInt(emp.emp_department_id) > 0) {
                    sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                }

                let employeeSalary = {
                    employeeId: emp.emp_id,
                    employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                    employeeUniqueId: emp.emp_unique_id,
                    location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                    jobRole: empJobRole,
                    sector: sectorName,
                    grossSalary: grossSalary,
                    nsitf: (1 / 100) * empAdjustedGrossII,
                    pension: (10 / 100) * empAdjustedGrossII,
                    employersDeductions: employersDeductions,
                    employersIncomes: employersIncomes,
                    totalDeduction: totalDeduction,
                    netSalary: netSalary,
                    incomes: incomes,
                    deductions: deductions,
                    month: payrollMonth,
                    year: payrollYear
                }

                return res.status(200).json(employeeSalary)

            } else {
                return res.status(200).json(`No Salary for Employee`)
            }


        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/pull-emolument', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required(),
            pmyl_location_id: Joi.number().required(),
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)


        } else {
            const pmylLocationId = payrollRequest.pmyl_location_id
            let employees = []
            if (pmylLocationId === 0) {
                employees = await employee.getActiveEmployees().then((data) => {
                    return data
                })
            } else {
                employees = await employee.getActiveEmployeesByLocation(pmylLocationId).then((data) => {
                    return data
                })
            }

            if (_.isEmpty(employees) || _.isNull(employees)) {
                return res.status(400).json(`No Employees Selected Location`)
            }

            for (const emp of employees) {

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0

                let deductions = []
                let incomes = []

                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                    for (const empSalary of employeeSalaries) {
                        if (parseInt(empSalary.payment.pd_employee) === 1) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                const incomeDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                incomes.push(incomeDetails)
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            } else {
                                const deductionDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                deductions.push(deductionDetails)
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }


                    }
                    netSalary = grossSalary - totalDeduction

                    let empJobRole = 'N/A'
                    if (parseInt(emp.emp_job_role_id) > 0) {
                        empJobRole = emp.jobrole.job_role
                    }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
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
                        netSalary: netSalary,
                        incomes: incomes,
                        deductions: deductions,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/deduction-report', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)


        } else {

            const employees = await employee.getActiveEmployees().then((data) => {
                return data
            })

            for (const emp of employees) {


                let totalDeduction = 0

                let deductions = []


                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                    for (const empSalary of employeeSalaries) {

                        if (parseInt(empSalary.payment.pd_employee) === 1) {
                            if (parseInt(empSalary.payment.pd_payment_type) === 2) {
                                const deductionDetails = {
                                    paymentName: empSalary.payment.pd_payment_name,
                                    amount: empSalary.salary_amount
                                }
                                deductions.push(deductionDetails)
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }

                    }

                    let empJobRole = 'N/A'
                    // if(parseInt(emp.emp_job_role_id) > 0){
                    //     empJobRole = emp.jobRole.job_role
                    // }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                    }

                    let salaryObject = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole: empJobRole,
                        sector: sectorName,
                        totalDeduction: totalDeduction,
                        deductions: deductions,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/variation-report', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)


        } else {

            const employees = await employee.getActiveEmployees().then((data) => {
                return data
            })

            for (const emp of employees) {


                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0

                let deductions = []
                let incomes = []


                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })

                if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                    for (const empSalary of employeeSalaries) {

                        if (parseInt(empSalary.payment.pd_employee) === 1) {
                            if (parseInt(empSalary.payment.pd_payment_variant) === 2) {
                                if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                                    const incomeDetails = {
                                        paymentName: empSalary.payment.pd_payment_name,
                                        amount: empSalary.salary_amount
                                    }
                                    incomes.push(incomeDetails)
                                    grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                                } else {
                                    const deductionDetails = {
                                        paymentName: empSalary.payment.pd_payment_name,
                                        amount: empSalary.salary_amount
                                    }
                                    deductions.push(deductionDetails)
                                    totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                                }
                            }
                        }


                    }
                    let empJobRole = 'N/A'
                    // if(parseInt(emp.emp_job_role_id) > 0){
                    //     empJobRole = emp.jobRole.job_role
                    // }

                    let sectorName = 'N/A'
                    if (parseInt(emp.emp_department_id) > 0) {
                        sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                    }

                    let salaryObject = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole: empJobRole,
                        sector: sectorName,
                        totalDeduction: totalDeduction,
                        deductions: deductions,
                        incomes: incomes,
                        totalIncomes: grossSalary,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/deduction-report-type', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required(),
            pd_id: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {

            return res.status(400).json(`Payroll Routine has not been run`)

        }

        let paymentDefinitionData = await paymentDefinition.findPaymentById(payrollRequest.pd_id).then((data) => {
            return data
        })

        if (_.isEmpty(paymentDefinitionData) || _.isNull(paymentDefinitionData)) {
            return res.status(400).json(`Payment Definition Does Not exist`)

        }


        const employees = await employee.getActiveEmployees().then((data) => {
            return data
        })

        for (const emp of employees) {


            let totalDeduction = 0

            let deductions = []


            let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                return data
            })

            if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                for (const empSalary of employeeSalaries) {
                    if (parseInt(empSalary.payment.pd_id) === parseInt(payrollRequest.pd_id)) {
                        const deductionDetails = {
                            paymentName: empSalary.payment.pd_payment_name,
                            amount: empSalary.salary_amount
                        }
                        deductions.push(deductionDetails)
                        totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                    }
                }
                let empJobRole = 'N/A'
                // if(parseInt(emp.emp_job_role_id) > 0){
                //     empJobRole = emp.jobRole.job_role
                // }

                let sectorName = 'N/A'
                if (parseInt(emp.emp_department_id) > 0) {
                    sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                }
                let paymentNumber = 'N/A'
                if (parseInt(paymentDefinitionData.pd_tie_number) > 0) {

                    let tieNumber = parseInt(paymentDefinitionData.pd_tie_number)
                    if (tieNumber === 1) {
                        paymentNumber = emp.emp_paye_no
                    }

                    if (tieNumber === 2) {
                        paymentNumber = emp.emp_pension_no
                    }

                    if (tieNumber === 3) {
                        paymentNumber = emp.emp_nhf
                    }

                }
                let salaryObject = {
                    employeeId: emp.emp_id,
                    employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                    employeeUniqueId: emp.emp_unique_id,
                    location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                    jobRole: empJobRole,
                    sector: sectorName,
                    totalDeduction: totalDeduction,
                    deductions: deductions,
                    month: payrollMonth,
                    year: payrollYear,
                    paymentNumber: paymentNumber
                }

                employeeSalary.push(salaryObject)

            }

        }
        return res.status(200).json(employeeSalary)


    } catch (err) {
        console.log(err.message)
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


        let taxRatesData = await taxRates.findAllTaxRate().then((data) => {
            return data
        })

        if (_.isEmpty(taxRatesData) || _.isNull(taxRatesData)) {
            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
                return res.status(400).json(`No tax Rate Setup `)

            })

        }
        let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate().then((data) => {
            return data
        })

        if (_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)) {
            await salary.undoSalaryMonthYear('01', '2022').then((data) => {
                return res.status(400).json(`Minimum Tax Rate Not Setup `)

            })
        }


        let paymentDefinitionTaxData = await paymentDefinition.findTax().then((data) => {
            return data
        })

        if (_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)) {
            await salary.undoSalaryMonthYear('01', '2022').then((data) => {
                return res.status(400).json(`No Payment Definition has been Indicated as Tax `)

            })
        }

        let newTaxableIncome = taxableIncome - welfareIncomes
        let checka = parseFloat(200000 / 12)
        let checkb = parseFloat((1 / 100) * taxableIncome)
        let allowableSum = checka
        if (checkb > checka) {
            allowableSum = checkb
        }
        let taxRelief = ((20 / 100) * taxableIncome) + (allowableSum)
        let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate) / 100) * (taxableIncome);
        let tempTaxAmount = newTaxableIncome - taxRelief
        let TtempTaxAmount = tempTaxAmount
        let cTax;
        let totalTaxAmount = 0;
        let i = 1;

        let taxObjects = []
        if (parseFloat(tempTaxAmount) > 0) {
            for (const tax of taxRatesData) {
                if (i < parseInt(taxRatesData.length)) {
                    if ((tempTaxAmount - tax.tr_band / 12) > 0) {

                        if (tempTaxAmount >= tax.tr_band / 12) {
                            cTax = (tax.tr_rate / 100) * (tax.tr_band / 12);
                            let taxObject = {
                                band: tax.tr_band / 12,
                                rate: tax.tr_rate,
                                amount: cTax
                            }
                            taxObjects.push(taxObject)
                        } else {
                            cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                            totalTaxAmount = cTax + totalTaxAmount
                            let taxObject = {
                                band: tax.tr_band / 12,
                                rate: tax.tr_rate,
                                amount: cTax
                            }
                            taxObjects.push(taxObject)
                            break;
                        }

                    } else {
                        cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                        totalTaxAmount = cTax + totalTaxAmount
                        let taxObject = {
                            band: tax.tr_band / 12,
                            rate: tax.tr_rate,
                            amount: cTax
                        }
                        taxObjects.push(taxObject)
                        break;
                    }


                } else {
                    cTax = (tax.tr_rate / 100) * (tempTaxAmount)
                    let taxObject = {
                        band: tax.tr_band / 12,
                        rate: tax.tr_rate,
                        amount: cTax
                    }
                    taxObjects.push(taxObject)

                }
                tempTaxAmount = tempTaxAmount - (tax.tr_band / 12);

                totalTaxAmount = cTax + totalTaxAmount
                i++;
            }

            if (totalTaxAmount <= minimumTax) {
                totalTaxAmount = minimumTax
            }

        } else {
            totalTaxAmount = minimumTax
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

        }
        return res.status(200).json(object)


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* Pay Order */
router.post('/pay-order', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required(),
            pym_location: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        const location = payrollRequest.pym_location
        let employees
        if (parseInt(location) > 0) {
            employees = await employee.getActiveEmployeesByLocation(location).then((data) => {
                return data
            })
        } else {
            employees = await employee.getActiveEmployees(location).then((data) => {
                return data
            })
        }
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
            return res.status(400).json(`Payroll Routine has not been run`)
        }

        for (const emp of employees) {

            let grossSalary = 0
            let netSalary = 0
            let totalDeduction = 0

            let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                return data
            })

            if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {
                for (const empSalary of employeeSalaries) {
                    if (parseInt(empSalary.payment.pd_employee) === 1) {
                        if (parseInt(empSalary.payment.pd_payment_type) === 1) {
                            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                        } else {
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }

                }
                netSalary = grossSalary - totalDeduction

                let empJobRole = 'N/A'
                // if(parseInt(emp.emp_job_role_id) > 0){
                //     empJobRole = emp.jobRole.job_role
                // }

                let sectorName = 'N/A'
                if (parseInt(emp.emp_department_id) > 0) {
                    sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                }

                let bankName = 'N/A'
                let bankSortCode = 'N/A'

                if (parseInt(emp.emp_bank_id) > 0) {
                    bankName = `${emp.bank.bank_name}`
                    bankSortCode = `${emp.bank.bank_code}`
                }


                let salaryObject = {
                    employeeId: emp.emp_id,
                    employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                    employeeUniqueId: emp.emp_unique_id,
                    accountNumber: emp.emp_account_no,
                    location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                    jobRole: empJobRole,
                    sector: sectorName,
                    bankName: bankName,
                    bankSortCode: bankSortCode,
                    grossSalary: grossSalary,
                    totalDeduction: totalDeduction,
                    netSalary: netSalary
                }

                employeeSalary.push(salaryObject)

            }

        }
        return res.status(200).json(employeeSalary)


    } catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/pension-report', auth, async function (req, res, next) {
    try {


        const schema = Joi.object({
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required(),
            pym_location: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        const location = payrollRequest.pym_location
        let employees
        if (parseInt(location) > 0) {
            employees = await employee.getActiveEmployeesByLocation(location).then((data) => {
                return data
            })
        } else {
            employees = await employee.getActiveEmployees(location).then((data) => {
                return data
            })
        }
        //check if payroll routine has been run
        let employeeSalary = []
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data) => {
            return data
        })

        if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
            return res.status(400).json(`Payroll Routine has not been run`)
        }

        let pensionPayments = await paymentDefinition.getPensionPayments().then((data) => {
            return data
        })
        if ((_.isNull(pensionPayments) || _.isEmpty(pensionPayments))) {
            return res.status(400).json(`No payments marked as pension`)
        }

        for (const emp of employees) {

            let pensionArray = [];

            let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                return data
            })

            if (!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))) {

                let totalPension = 0

                let empAdjustedGrossII = 0;
                let fullGross = 0;
                let empAdjustedGross = 0


                let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data) => {
                    return data
                })


                for (const salary of fullSalaryData) {
                    if (parseInt(salary.payment.pd_payment_type) === 1) {
                        fullGross = parseFloat(salary.salary_amount) + fullGross
                    }


                    if (parseInt(salary.payment.pd_total_gross) === 1) {
                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                            empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount)

                        }

                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                            empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount)

                        }

                    }

                    if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                            empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount)

                        }

                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                            empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount)

                        }

                    }
                }


                for (const pensionPayment of pensionPayments) {
                    let amount = 0

                    let checkSalary = await salary.getEmployeeSalaryMonthYearPd(payrollMonth, payrollYear, emp.emp_id, pensionPayment.pd_id).then((data) => {
                        return data
                    })
                    if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
                        amount = parseFloat(checkSalary.salary_amount)
                    }
                    let empPensionObject = {
                        "Payment Name": pensionPayment.pd_payment_name,
                        "Amount": amount
                    }

                    totalPension = totalPension + amount

                    pensionArray.push(empPensionObject)
                }

                let empJobRole = 'N/A'
                if (parseInt(emp.emp_job_role_id) > 0) {
                    empJobRole = emp.jobrole.job_role
                }

                let sectorName = 'N/A'
                if (parseInt(emp.emp_department_id) > 0) {
                    sectorName = `${emp.sector.department_name} - ${emp.sector.d_t3_code}`
                }
                let pfa = 'N/A'
                if ((!_.isNull(emp.emp_pension_id) || parseInt(emp.emp_pension_id) > 0)) {
                    pfa = emp.pension.provider_name
                }

                let salaryObject = {
                    employeeId: emp.emp_id,
                    employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                    employeeUniqueId: emp.emp_unique_id,
                    accountNumber: emp.emp_account_no,
                    location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                    jobRole: empJobRole,
                    sector: sectorName,
                    pfa: pfa,
                    pin: emp.emp_pension_no,
                    totalPension: totalPension,
                    pensionArray: pensionArray,
                    month: payrollMonth,
                    year: payrollYear,
                    adjustedGrossII: empAdjustedGrossII

                }

                employeeSalary.push(salaryObject)

            }

        }
        return res.status(200).json(employeeSalary)


    } catch (err) {
        console.log(err.message)
        next(err);

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
