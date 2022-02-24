const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const salaryGrade =  require('../services/salaryGradeService')
const salaryStructure = require('../services/salaryStructureService')
const paymentDefinition = require('../services/paymentDefinitionService')
const employee = require('../services/employeeService')
const locationAllowance =  require('../services/locationAllowanceService')
const salary = require('../services/salaryService')
const variationalPayment = require('../services/variationalPaymentService')
const payrollMonthYear =  require('../services/payrollMonthYearService')
const taxRates = require('../services/taxRateService')
const minimumTaxRate = require('../services/minimumTaxRateService')
const { addLeaveAccrual, computeLeaveAccruals, removeLeaveAccrual } = require("../routes/leaveAccrual");
const leaveTypeService = require('../services/leaveTypeService');
const logs = require('../services/logService')


/* run salary routine */
router.get('/salary-routine', auth,  async function(req, res, next) {
    try{

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }
        else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            let salaryObject = {}

            // check for pending variational payments
            const pendingVariationalPayment = await variationalPayment.getUnconfirmedVariationalPaymentMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isEmpty(pendingVariationalPayment) || _.isNull(pendingVariationalPayment)){

                //check if payroll routine has been run
                const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                    return data
                })

                if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){
                    const employees = await employee.getActiveEmployees().then((data)=>{
                        return data
                    })

                    let GrossArray = [ ]

                    for (const emp of employees) {

                        let empGross = parseFloat(emp.emp_gross)

                        if(empGross > 0){
                            //check employee variational payments
                            const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(emp.emp_id, payrollMonth, payrollYear).then((data)=>{
                                return data
                            })

                            if(!(_.isEmpty(employeeVariationalPayments) || _.isNull(employeeVariationalPayments))){


                                for(const empVP of employeeVariationalPayments){


                                    salaryObject = {
                                        salary_empid: emp.emp_id,
                                        salary_paymonth: payrollMonth,
                                        salary_payyear: payrollYear,
                                        salary_pd: empVP.vp_payment_def_id,
                                        salary_amount: empVP.vp_amount,
                                        salary_share: 0,
                                        salary_tax: 0
                                    }

                                    let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                        return data
                                    })

                                    if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`An error Occurred while Processing Routine variational payments `)

                                        })

                                    }


                                }
                            }

                            const grossPercentage =  await paymentDefinition.findCodeWithGross().then((data)=>{
                                return data
                            })
                            if(_.isEmpty(grossPercentage) || _.isNull(grossPercentage)){

                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                    return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)

                                })

                            }
                            else {

                                const totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) => {
                                    return data
                                })

                                if(parseFloat(totalPercentageGross) > 100 || parseFloat( totalPercentageGross) < 100 ){
                                    await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                        return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)

                                    })

                                }else {
                                    let amount = 0;
                                    let percent = 0;

                                    let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition().then((data)=>{
                                        return data
                                    })
                                    let basicSalaryPercent = parseFloat(paymentDefinitionData.pd_pr_gross)

                                    //  splitting into percentages

                                    for(const percentage of grossPercentage){
                                        percent = parseFloat(percentage.pd_pr_gross)
                                        amount = (percent/100)*empGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: percentage.pd_id,
                                            salary_amount: amount,
                                            salary_share: percent,
                                            salary_tax: 0
                                        }


                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                            return data
                                        })

                                        if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                return res.status(400).json(`An error Occurred while Processing Routine splitting gross `)

                                            })

                                        }

                                    }


                                    // hazard allowances
                                    const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(emp.emp_location_id).then((data)=>{
                                        return data
                                    })

                                    if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)) {
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

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                                return data
                                            })

                                            if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                    return res.status(400).json(`An error Occurred while Processing Routine hazard allowance `)

                                                })

                                            }


                                        }
                                    }


                                    //computational Payments

                                    const computationalPayments = await paymentDefinition.getComputedPayments().then((data)=>{
                                        return data
                                    })

                                    let fullGross = 0;
                                    let empAdjustedGross = 0

                                    let fullSalaryData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                                        return data
                                    })


                                    for(const salary of fullSalaryData){
                                        if(parseInt(salary.payment.pd_payment_type) === 1){
                                            fullGross = parseFloat(salary.salary_amount) + fullGross
                                        }


                                        if(parseInt(salary.payment.pd_total_gross) === 1){
                                            if(parseInt(salary.payment.pd_payment_type) === 1 ){
                                                empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount)

                                            }

                                            if(parseInt(salary.payment.pd_payment_type) === 0 ){
                                                empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount)

                                            }

                                        }
                                    }


                                    let basicFullGross = (basicSalaryPercent/100)*fullGross

                                    let basicAdjustedGross = (basicSalaryPercent/100)*empAdjustedGross;

                                    for(const computationalPayment of computationalPayments ){

                                        //adjusted gross computation
                                        if(parseInt(computationalPayment.pd_amount) === 1){

                                            amount = (parseFloat(computationalPayment.pd_percentage)/100)*empAdjustedGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                                return data
                                            })

                                            if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }


                                        //adjusted gross basic computation
                                        if(parseInt(computationalPayment.pd_amount) === 2){
                                            amount = (parseFloat(computationalPayment.pd_percentage)/100)* basicAdjustedGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                                return data
                                            })

                                            if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                    return res.status(400).json(`An error Occurred while Processing Routine basic computation `)

                                                })

                                            }

                                        }



                                        // Full Gross
                                        if(parseInt(computationalPayment.pd_amount) === 3){

                                            amount = (parseFloat(computationalPayment.pd_percentage)/100)*fullGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                                return data
                                            })

                                            if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }


                                        // Full basic Gross
                                        if(parseInt(computationalPayment.pd_amount) === 4){

                                            amount = (parseFloat(computationalPayment.pd_percentage)/100)*basicFullGross

                                            salaryObject = {
                                                salary_empid: emp.emp_id,
                                                salary_paymonth: payrollMonth,
                                                salary_payyear: payrollYear,
                                                salary_pd: computationalPayment.pd_id,
                                                salary_amount: amount,
                                                salary_share: 0,
                                                salary_tax: 0
                                            }

                                            let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                                return data
                                            })

                                            if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                                await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                    return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                                })

                                            }
                                        }
                                    }

                                    //tax computation
                                    let welfareIncomes = 0;
                                    let taxableIncome = 0;
                                    let taxableIncomeData = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                                        return data
                                    })

                                    for(const income of taxableIncomeData){
                                       if((parseInt(income.payment.pd_payment_type) === 1) && (parseInt(income.payment.pd_payment_taxable) === 1) ){
                                         taxableIncome = parseFloat(income.salary_amount) + taxableIncome
                                       }

                                       if(parseInt(income.payment.pd_welfare) === 1){
                                           welfareIncomes = welfareIncomes + parseFloat(income.salary_amount)
                                       }

                                    }


                                    let taxRatesData = await taxRates.findAllTaxRate().then((data)=>{
                                        return data
                                    })

                                    if(_.isEmpty(taxRatesData) || _.isNull(taxRatesData)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`No tax Rate Setup `)

                                        })

                                    }
                                    let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate().then((data)=>{
                                        return data
                                    })

                                    if(_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`Minimum Tax Rate Not Setup `)

                                        })
                                    }


                                    let paymentDefinitionTaxData = await paymentDefinition.findTax().then((data)=>{
                                        return data
                                    })

                                    if(_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`No Payment Definition has been Indicated as Tax `)

                                        })
                                    }
                                    let newTaxableIncome = taxableIncome - welfareIncomes
                                    let checka = parseFloat(200000/12)
                                    let checkb = parseFloat((1/100)  * taxableIncome)
                                    let allowableSum = checka
                                    if(checkb > checka){
                                        allowableSum = checkb
                                    }
                                    let taxRelief = ((20/100) * taxableIncome) + (allowableSum)
                                    let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate)/100) * (taxableIncome - taxRelief);
                                    let tempTaxAmount = newTaxableIncome - taxRelief
                                    let cTax;
                                    let totalTaxAmount = 0;
                                    let i = 0;
                                    for(const tax of taxRatesData){
                                        if(i < parseInt(taxRatesData.length)){
                                            if(tempTaxAmount >= tax.tr_band/12){
                                                cTax =  (tax.tr_rate/100) * (tax.tr_band/12);
                                            } else{
                                                cTax = (tax.tr_rate/100) * (tempTaxAmount)
                                                totalTaxAmount = cTax + totalTaxAmount
                                                break;
                                            }
                                        }else {
                                            cTax = (tax.tr_rate/100) * (tempTaxAmount)

                                        }

                                        tempTaxAmount = tempTaxAmount - (tax.tr_band/12);
                                        totalTaxAmount = cTax + totalTaxAmount
                                        i++;
                                    }

                                    if(totalTaxAmount <= minimumTax) {
                                        totalTaxAmount = minimumTax
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

                                    let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                        return data
                                    })

                                    if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`An error Occurred while Processing Routine gross computation `)

                                        })

                                    }

                                    const leaveTypesData = await leaveTypeService.getAllLeaves().then((data)=>{
                                        return data
                                    })

                                    if(_.isNull(leaveTypesData) || _.isEmpty(leaveTypesData)){
                                        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                            return res.status(400).json(`An error Occurred while Processing No Leave type to accrue for Employees `)

                                        })

                                    }

                                    for(const leaveType of leaveTypesData){
                                        const leaveAccrual = {
                                            lea_emp_id: emp.emp_id,
                                            lea_month: payrollMonth,
                                            lea_year: payrollYear,
                                            lea_leave_type: leaveType.leave_type_id,
                                            lea_rate: parseFloat(leaveType.lt_rate)
                                        }

                                       const addAccrualResponse =  await addLeaveAccrual(leaveAccrual).then((data)=>{
                                           return data
                                       })

                                        if(_.isEmpty(addAccrualResponse) || _.isNull(addAccrualResponse)){
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
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

                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Ran Payroll Routine",
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes)=>{

                        return  res.status(200).json('Action Successful')
                    })

                }
                else{

                    return res.status(400).json(`Payroll Routine has already been run`)
                }


            }else{

                return res.status(400).json(`There are pending Variational Payments`)
            }

        }

    }catch (err) {
        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year

        await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
            console.log(err.message)
            next(err);
        })

    }
});


/* check payroll routine */
router.get('/check-salary-routine', auth,  async function(req, res, next) {
    try{

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(!(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck))){
                return res.status(400).json(`Payroll Routine has already been run`)
            }else{
                return res.status(200).json(`Payroll Routine has not been run`)
            }

        }

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* undo salary */
router.get('/undo-salary-routine', auth,  async function(req, res, next) {
    try{

        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })

        const payrollMonth = payrollMonthYearData.pym_month
        const payrollYear = payrollMonthYearData.pym_year

       const salaryRoutineUndo =  await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
            return data
        })

        const leaveAccrualData = {
            lea_month:payrollMonth,
            lea_year: payrollYear,
        }
        const leaveAccrualsUndo = await removeLeaveAccrual(leaveAccrualData).then((data)=>{
            return data
        })

        const reverseVariationalPayments  = await variationalPayment.undoVariationalPaymentMonthYear(payrollMonth, payrollYear).then((data)=>{
            return data
        })

        return res.status(200).json(`Action Successful`)

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

/* fetch salary */
router.get('/pull-salary-routine', auth,  async function(req, res, next) {
    try{


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }
        else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = [ ]
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)



            }
            else{

                const employees = await employee.getActiveEmployees().then((data)=>{
                    return data
                })

                for (const emp of employees) {

                            let grossSalary = 0
                            let netSalary = 0
                            let totalDeduction = 0

                            let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                                return data
                            })

                    if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){
                        for (const empSalary of employeeSalaries) {
                            if(parseInt(empSalary.payment.pd_payment_type) === 1){
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            }else{
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }
                        netSalary = grossSalary - totalDeduction

                        let salaryObject = {
                            employeeId: emp.emp_id,
                            employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                            employeeUniqueId: emp.emp_unique_id,
                            location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                            jobRole :`${emp.JobRole.job_role}`,
                            sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
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

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.post('/pull-salary-routine', auth,  async function(req, res, next) {
    try{


        const schema = Joi.object( {
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year

            //check if payroll routine has been run
            let employeeSalary = [ ]
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)



            }
            else{

                const employees = await employee.getActiveEmployees().then((data)=>{
                    return data
                })

                for (const emp of employees) {

                    let grossSalary = 0
                    let netSalary = 0
                    let totalDeduction = 0

                    let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                        return data
                    })

                    if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){
                        for (const empSalary of employeeSalaries) {
                            if(parseInt(empSalary.payment.pd_payment_type) === 1){
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            }else{
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }
                        netSalary = grossSalary - totalDeduction

                        let salaryObject = {
                            employeeId: emp.emp_id,
                            employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                            employeeUniqueId: emp.emp_unique_id,
                            location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                            jobRole :`${emp.JobRole.job_role}`,
                            sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
                            grossSalary: grossSalary,
                            totalDeduction: totalDeduction,
                            netSalary: netSalary
                        }

                        employeeSalary.push(salaryObject)

                    }

                }
                return res.status(200).json(employeeSalary)
            }



    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/approve-salary-routine', auth,  async function(req, res, next) {
    try{


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }
        else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = [ ]
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)



            }
            else{
                let today = new Date();
                let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();


                const approveResponse = await salary.approveSalary(payrollMonth, payrollYear, req.user.username.user_id, date).then((data)=>{
                    return data
                })

                if(!(_.isEmpty(approveResponse) || _.isNull(approveResponse))){
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": `approved payroll routine for ${payrollMonth} - ${payrollYear}`,
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes)=>{
                        return  res.status(200).json(`Payroll Approved`)
                    })
                }

            }

        }

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/confirm-salary-routine', auth,  async function(req, res, next) {
    try{


        const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }
        else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run
            let employeeSalary = [ ]
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)
            }
            else{
                let today = new Date();
                let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();


                const confirmResponse = await salary.confirmSalary(payrollMonth, payrollYear, req.user.username.user_id, date).then((data)=>{
                    return data
                })

                if(!(_.isEmpty(confirmResponse) || _.isNull(confirmResponse))){
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": `Confirmed payroll routine for ${payrollMonth} - ${payrollYear}`,
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes)=>{
                        return  res.status(200).json(`Payroll Confirmed`)
                    })
                }

            }

        }

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.get('/pull-salary-routine/:empId', auth,  async function(req, res, next) {
    try{

       const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data)=>{
            return data
        })
        if(_.isNull(payrollMonthYearData) || _.isEmpty(payrollMonthYearData)){
            return res.status(400).json(`No payroll month and year set`)
        }
        else{
            const payrollMonth = payrollMonthYearData.pym_month
            const payrollYear = payrollMonthYearData.pym_year
            //check if payroll routine has been run

            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)
            }
            else{
                const emp = await employee.getEmployee(parseInt(req.params.empId)).then((data)=>{
                    return data
                })

                if(_.isEmpty(emp) || _.isNull(emp)){
                    return  res.status(400).json(`Employee Doesnt Exist`)
                }

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0
                let deductions = [ ]
                let incomes = [ ]

                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                    return data
                })

                if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){

                    for (const empSalary of employeeSalaries) {
                        if(parseInt(empSalary.payment.pd_payment_type) === 1){
                            const incomeDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                            incomes.push(incomeDetails)
                            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                        }else{
                            const deductionDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                            deductions.push(deductionDetails)
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }
                    netSalary = grossSalary - totalDeduction

                    let employeeSalary = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole :`${emp.JobRole.job_role}`,
                        sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
                        grossSalary: grossSalary,
                        nsitf:(1/100) * grossSalary,
                        pension:(10/100) * grossSalary,
                        totalDeduction: totalDeduction,
                        netSalary: netSalary,
                        incomes: incomes,
                        deductions: deductions
                    }

                    return res.status(200).json(employeeSalary)

                }else{
                    return res.status(200).json(`No Salary for Employee`)
                }


            }

        }

    }catch (err) {
        console.log(err.message)
        next(err);

    }
});

router.post('/pull-salary-routine/:empId', auth,  async function(req, res, next) {
    try{

        const schema = Joi.object( {
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
            const payrollMonth = payrollRequest.pym_month
            const payrollYear = payrollRequest.pym_year
            //check if payroll routine has been run

            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)
            }
            else{
                const emp = await employee.getEmployee(parseInt(req.params.empId)).then((data)=>{
                    return data
                })

                if(_.isEmpty(emp) || _.isNull(emp)){
                    return  res.status(400).json(`Employee Doesnt Exist`)
                }

                let grossSalary = 0
                let netSalary = 0
                let totalDeduction = 0
                let deductions = [ ]
                let incomes = [ ]

                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                    return data
                })

                if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){

                    for (const empSalary of employeeSalaries) {
                        if(parseInt(empSalary.payment.pd_payment_type) === 1){
                            const incomeDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                            incomes.push(incomeDetails)
                            grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                        }else{
                            const deductionDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                            deductions.push(deductionDetails)
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }
                    netSalary = grossSalary - totalDeduction

                    let employeeSalary = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole :`${emp.JobRole.job_role}`,
                        sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
                        grossSalary: grossSalary,
                        totalDeduction: totalDeduction,
                        netSalary: netSalary,
                        incomes: incomes,
                        deductions: deductions,
                        month: payrollMonth,
                        year: payrollYear
                    }

                    return res.status(200).json(employeeSalary)

                }else{
                    return res.status(200).json(`No Salary for Employee`)
                }


            }



    }catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/pull-emolument', auth,  async function(req, res, next) {
    try{


        const schema = Joi.object( {
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
            //check if payroll routine has been run
            let employeeSalary = [ ]
            const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return data
            })

            if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

                return res.status(400).json(`Payroll Routine has not been run`)



            }
            else{

                const employees = await employee.getActiveEmployees().then((data)=>{
                    return data
                })

                for (const emp of employees) {

                    let grossSalary = 0
                    let netSalary = 0
                    let totalDeduction = 0

                    let deductions = [ ]
                    let incomes = [ ]

                    let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                        return data
                    })

                    if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){

                        for (const empSalary of employeeSalaries) {
                            if(parseInt(empSalary.payment.pd_payment_type) === 1){
                                const incomeDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                                incomes.push(incomeDetails)
                                grossSalary = parseFloat(empSalary.salary_amount) + grossSalary
                            }else{
                                const deductionDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                                deductions.push(deductionDetails)
                                totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                            }
                        }
                        netSalary = grossSalary - totalDeduction

                        let salaryObject = {
                            employeeId: emp.emp_id,
                            employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                            employeeUniqueId: emp.emp_unique_id,
                            location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                            jobRole :`${emp.JobRole.job_role}`,
                            sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
                            grossSalary: grossSalary,
                            totalDeduction: totalDeduction,
                            netSalary: netSalary,
                            incomes: incomes,
                            deductions: deductions,
                            month:payrollMonth,
                            year: payrollYear
                        }

                        employeeSalary.push(salaryObject)

                    }

                }
                return res.status(200).json(employeeSalary)
            }



    }catch (err) {
        console.log(err.message)
        next(err);

    }
});


router.post('/deduction-report', auth,  async function(req, res, next) {
    try{


        const schema = Joi.object( {
            pym_month: Joi.number().required(),
            pym_year: Joi.number().required()
        })

        const payrollRequest = req.body
        const validationResult = schema.validate(payrollRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollMonth = payrollRequest.pym_month
        const payrollYear = payrollRequest.pym_year
        //check if payroll routine has been run
        let employeeSalary = [ ]
        const salaryRoutineCheck = await salary.getSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
            return data
        })

        if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

            return res.status(400).json(`Payroll Routine has not been run`)



        }
        else{

            const employees = await employee.getActiveEmployees().then((data)=>{
                return data
            })

            for (const emp of employees) {


                let totalDeduction = 0

                let deductions = [ ]


                let employeeSalaries = await salary.getEmployeeSalary(payrollMonth, payrollYear, emp.emp_id).then((data)=>{
                    return data
                })

                if(!(_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries))){

                    for (const empSalary of employeeSalaries) {
                        if(parseInt(empSalary.payment.pd_payment_type) === 2){
                            const deductionDetails = { paymentName: empSalary.payment.pd_payment_name, amount: empSalary.salary_amount}
                            deductions.push(deductionDetails)
                            totalDeduction = parseFloat(empSalary.salary_amount) + totalDeduction
                        }
                    }


                    let salaryObject = {
                        employeeId: emp.emp_id,
                        employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
                        employeeUniqueId: emp.emp_unique_id,
                        location: `${emp.location.location_name} - ${emp.location.l_t6_code}`,
                        jobRole :`${emp.JobRole.job_role}`,
                        sector: `${emp.JobRole.Department.department_name} - ${emp.JobRole.Department.d_t3_code}`,
                        totalDeduction: totalDeduction,
                        deductions: deductions,
                        month:payrollMonth,
                        year: payrollYear
                    }

                    employeeSalary.push(salaryObject)

                }

            }
            return res.status(200).json(employeeSalary)
        }



    }catch (err) {
        console.log(err.message)
        next(err);

    }
});




/* run salary routine */
router.get('/salary-test-routine',   async function(req, res, next) {
    try{

        // let taxableIncome = 660805;

        let welfareIncomes = 0;
        let taxableIncome = 0;
        let taxableIncomeData = await salary.getEmployeeSalary('01', '2022', '5').then((data)=>{
            return data
        })

        for(const income of taxableIncomeData){
            if((parseInt(income.payment.pd_payment_type) === 1) && (parseInt(income.payment.pd_payment_taxable) === 1) ){
                taxableIncome = parseFloat(income.salary_amount) + taxableIncome
            }

            if(parseInt(income.payment.pd_welfare) === 1){
                welfareIncomes = welfareIncomes + parseFloat(income.salary_amount)
            }

        }



        let taxRatesData = await taxRates.findAllTaxRate().then((data)=>{
            return data
        })

        if(_.isEmpty(taxRatesData) || _.isNull(taxRatesData)){
            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                return res.status(400).json(`No tax Rate Setup `)

            })

        }
        let minimumTaxRateData = await minimumTaxRate.findAllMinimumTaxRate().then((data)=>{
            return data
        })

        if(_.isEmpty(minimumTaxRateData) || _.isNull(minimumTaxRateData)){
            await salary.undoSalaryMonthYear('01', '2022').then((data)=>{
                return res.status(400).json(`Minimum Tax Rate Not Setup `)

            })
        }


        let paymentDefinitionTaxData = await paymentDefinition.findTax().then((data)=>{
            return data
        })

        if(_.isEmpty(paymentDefinitionTaxData) || _.isNull(paymentDefinitionTaxData)){
            await salary.undoSalaryMonthYear('01', '2022').then((data)=>{
                return res.status(400).json(`No Payment Definition has been Indicated as Tax `)

            })
        }

        let newTaxableIncome = taxableIncome - welfareIncomes
        let checka = parseFloat(200000/12)
        let checkb = parseFloat((1/100)  * taxableIncome)
        let allowableSum = checka
        if(checkb > checka){
            allowableSum = checkb
        }
        let taxRelief = ((20/100) * taxableIncome) + (allowableSum)
        let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate)/100) * (taxableIncome - taxRelief);
        let tempTaxAmount = newTaxableIncome - taxRelief
        let cTax;
        let totalTaxAmount = 0;
        let i = 0;
        for(const tax of taxRatesData){
            if(i < parseInt(taxRatesData.length)){
                if(tempTaxAmount >= tax.tr_band/12){
                    cTax =  (tax.tr_rate/100) * (tax.tr_band/12);
                } else{
                    cTax = (tax.tr_rate/100) * (tempTaxAmount)
                    totalTaxAmount = cTax + totalTaxAmount
                    break;
                }
            }else {
                cTax = (tax.tr_rate/100) * (tempTaxAmount)

            }

            tempTaxAmount = tempTaxAmount - (tax.tr_band/12);
            totalTaxAmount = cTax + totalTaxAmount
            i++;
        }

        if(totalTaxAmount <= minimumTax) {
            totalTaxAmount = minimumTax
        }
        let object = {
            taxable: taxableIncome,
            tax: totalTaxAmount
        }
        return res.status(200).json(object)


    }catch (err) {
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
