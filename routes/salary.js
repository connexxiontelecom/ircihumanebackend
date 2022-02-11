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
const { addLeaveAccrual, computeLeaveAccruals } = require("../routes/leaveAccrual");
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
        }else{
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

                    for (const emp of employees) {
                        let empAdjustedGross = parseFloat(emp.emp_gross)
                        if(empAdjustedGross > 0){
                            //check employee variational payments
                            const employeeVariationalPayments = await variationalPayment.getVariationalPaymentEmployeeMonthYear(emp.emp_id, payrollMonth, payrollYear).then((data)=>{
                                return data
                            })

                            if(!(_.isEmpty(employeeVariationalPayments) || _.isNull(employeeVariationalPayments))){


                                for(const empVP of employeeVariationalPayments){

                                    if(parseInt(empVP.payment.pd_total_gross) === 1){
                                        if(parseInt(empVP.payment.pd_payment_type) === 1 ){
                                            empAdjustedGross = empAdjustedGross + parseFloat(empVP.vp_amount)

                                        }

                                        if(parseInt(empVP.payment.pd_payment_type) === 0 ){
                                            empAdjustedGross = empAdjustedGross - parseFloat(empVP.vp_amount)

                                        }



                                    }

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
                                    let amount
                                    let percent
                                    let basicSalary;
                                    let paymentDefinitionData = await paymentDefinition.findBasicPaymentDefinition().then((data)=>{
                                        return data
                                    })

                                    //  splitting into percentages

                                    for(const percentage of grossPercentage){
                                        percent = parseFloat(percentage.pd_pr_gross)
                                        amount = (percent/100)*empAdjustedGross

                                        salaryObject = {
                                            salary_empid: emp.emp_id,
                                            salary_paymonth: payrollMonth,
                                            salary_payyear: payrollYear,
                                            salary_pd: percentage.pd_id,
                                            salary_amount: amount,
                                            salary_share: percent,
                                            salary_tax: 0
                                        }

                                        if(parseInt(paymentDefinitionData.pd_id) === parseInt(percentage.pd_id)){
                                            basicSalary = amount
                                        }
                                        let salaryAddResponse = await salary.addSalary(salaryObject).then((data)=>{
                                            return data
                                        })

                                        if(_.isEmpty(salaryAddResponse) || _.isNull(salaryAddResponse)){
                                            await salary.undoSalaryMonthYear(payrollMonth, payrollYear).then((data)=>{
                                                return res.status(400).json(`An error Occurred while Processing Routine spliting gross `)

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

                                    for(const computationalPayment of computationalPayments ){

                                        //gross computation
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

                                        //basic computation
                                        if(parseInt(computationalPayment.pd_amount) === 2){
                                            amount = (parseFloat(computationalPayment.pd_percentage)/100)*basicSalary

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
                                    }

                                    //tax computation
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

                                    let taxRelief = ((20/100) * empAdjustedGross) + (200000/12)
                                    let minimumTax = (parseFloat(minimumTaxRateData[0].mtr_rate)/100) * (empAdjustedGross - taxRelief);
                                    let tempTaxAmount = empAdjustedGross - taxRelief
                                    let cTax;
                                    let totalTaxAmount = 0;

                                    for(const tax of taxRatesData){
                                        if(tempTaxAmount >= tax.tr_band/12){
                                            cTax =  (tax.tr_rate/100) * (tax.tr_band/12);
                                        } else{
                                            cTax = (tax.tr_rate/100) * (tempTaxAmount)
                                            totalTaxAmount = cTax + totalTaxAmount
                                            break;
                                        }
                                        tempTaxAmount = tempTaxAmount - (tax.tr_band/12);
                                        totalTaxAmount = cTax + totalTaxAmount
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
                        return  res.status(200).json(`Action Successful`)
                    })

                }else{

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


/* Add to Salary structure */
router.post('/add-salary-structure', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            ss_empid: Joi.number().required(),
            ss_gross: Joi.number().precision(2).required(),
            ss_grade: Joi.number().required(),
        })

        const salaryStructureRequest = req.body
        const validationResult = schema.validate(salaryStructureRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let empId = salaryStructureRequest.ss_empid

        const employeeData =   await employee.getEmployee(empId).then((data)=>{
            return  data
        })

        if(!_.isEmpty(employeeData) || !_.isNull(employeeData)){
            const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data)=>{
                return data
            })

            if(!(_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure))){
                return res.status(400).json(`Salary Structure already set up, consider updating`)
            }
            else{
                const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data)=>{
                    return data
                })

                if(_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade) ){
                    return res.status(400).json(`Salary Grade Doesn't Exists`)
                }
                else{
                    let maximum = parseFloat(empSalaryGrade.sg_maximum)
                    let minimum = parseFloat(empSalaryGrade.sg_minimum)
                    let gross = parseFloat(salaryStructureRequest.ss_gross)

                    if((gross < minimum) || (gross > maximum)){
                        return res.status(400).json(`Gross Salary not within grade band`)
                    }else{
                        const grossPercentage =  await paymentDefinition.findCodeWithGross().then((data)=>{
                            return data
                        })

                        if(_.isEmpty(grossPercentage) || _.isNull(grossPercentage)){
                            return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)
                        }
                        else{
                            let totalPercentageGross =  await paymentDefinition.findSumPercentage().then((data) =>{
                                return data
                            })

                            if(parseFloat(totalPercentageGross) > 100 || parseFloat( totalPercentageGross) < 100 ){
                                return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)

                            }else{
                                await salaryStructure.deleteSalaryStructuresEmployee(empId).then()

                                let salaryObject = {}
                                let amount
                                let percent
                                for(const percentage of grossPercentage){
                                    percent = parseFloat(percentage.pd_pr_gross)
                                    amount = (percent/100)*gross

                                    salaryObject = {
                                        ss_empid: empId,
                                        ss_pd: percentage.pd_id,
                                        ss_amount: amount

                                    }

                                    await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                        if(_.isEmpty(data) || _.isNull(data)){
                                            salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                return res.status(400).json(`An error occurred while adding`)
                                            })
                                        }
                                    })

                                }

                                const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(employeeData.emp_location_id).then((data)=>{
                                    return data
                                })

                                if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)){
                                    for(const allowance of hazardAllowances){

                                        salaryObject = {
                                            ss_empid: empId,
                                            ss_pd: allowance.la_payment_id,
                                            ss_amount: allowance.la_amount

                                        }

                                        let salaryStructureAddResponse = await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                            return  data

                                        })

                                        if(_.isEmpty(salaryStructureAddResponse) || _.isNull(salaryStructureAddResponse)){
                                            await salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                                                return res.status(400).json(`An error occurred while adding`)
                                            })
                                        }

                                    }

                                    await employee.updateGrossSalary(empId, gross).then((updateData)=>{
                                        if(!(_.isEmpty(updateData) || _.isNull(updateData)) ) {
                                            const logData = {
                                                "log_user_id": req.user.username.user_id,
                                                "log_description": "Updated salary structure",
                                                "log_date": new Date()
                                            }
                                            logs.addLog(logData).then((logRes)=>{
                                                //return res.status(200).json(logRes);
                                                return  res.status(200).json(`Action Successful`)
                                            })
                                        } else {
                                            salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                return res.status(400).json(`An error occurred while updating Employee's Gross`)
                                            })

                                        }
                                    })

                                }
                                else{

                                    await salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                        return res.status(400).json(`No Hazard Allowance Set for Employee Location`)
                                    })
                                }

                            }


                        }
                    }

                }

            }

        }
        else{
            return res.status(400).json(`Employee Doesn't Exists`)
        }


    } catch (err) {
        console.error(`Error while adding salary structure `, err.message);
        next(err);
    }
});


/* Update Salary Structure */
router.patch('/update-salary-structure/:emp_id', auth,  async function(req, res, next) {
    try {
        const empId = req.params.emp_id
        const schema = Joi.object( {
            ss_gross: Joi.number().precision(2).required(),
            ss_grade: Joi.number().required(),
        })

        const salaryStructureRequest = req.body
        const validationResult = schema.validate(salaryStructureRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

      const employeeData =   await employee.getEmployee(empId).then((data)=>{
          return  data

        })

        if(!_.isEmpty(employeeData) || !_.isNull(employeeData)){
            const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data)=>{
                return data
            })

            if(_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure)){
                return res.status(400).json(`Salary Structure was never setup, consider setting up`)
            }
            else{



                const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data)=>{
                    return data
                })

                if(_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade) ){
                    return res.status(400).json(`Salary Grade Doesn't Exists`)
                }
                else{
                    let maximum = parseFloat(empSalaryGrade.sg_maximum)
                    let minimum = parseFloat(empSalaryGrade.sg_minimum)
                    let gross = parseFloat(salaryStructureRequest.ss_gross)

                    if((gross < minimum) || (gross > maximum)){
                        return res.status(400).json(`Gross Salary not within grade band`)
                    }else{
                        const grossPercentage =  await paymentDefinition.findCodeWithGross().then((data)=>{
                            return data
                        })

                        if(_.isEmpty(grossPercentage) || _.isNull(grossPercentage)){
                            return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)
                        }
                        else{
                            let totalPercentageGross =  await paymentDefinition.findSumPercentage().then((data) =>{
                                return data
                            })

                            if(parseFloat(totalPercentageGross) > 100 || parseFloat( totalPercentageGross) < 100 ){
                                return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)

                            }else{
                                await salaryStructure.deleteSalaryStructuresEmployee(empId).then()

                                let salaryObject = {}
                                let amount
                                let percent
                                for(const percentage of grossPercentage){
                                    percent = parseFloat(percentage.pd_pr_gross)
                                    amount = (percent/100)*gross

                                    salaryObject = {
                                        ss_empid: empId,
                                        ss_pd: percentage.pd_id,
                                        ss_amount: amount

                                    }

                                   await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                        if(_.isEmpty(data) || _.isNull(data)){
                                            salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                return res.status(400).json(`An error occurred while adding`)
                                            })
                                        }
                                    })

                                }

                                const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(employeeData.emp_location_id).then((data)=>{
                                    return data
                                })

                                if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)){
                                    for(const allowance of hazardAllowances){

                                        salaryObject = {
                                            ss_empid: empId,
                                            ss_pd: allowance.la_payment_id,
                                            ss_amount: allowance.la_amount

                                        }

                                        let salaryStructureAddResponse = await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                            return  data

                                        })

                                        if(_.isEmpty(salaryStructureAddResponse) || _.isNull(salaryStructureAddResponse)){
                                            await salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                                                return res.status(400).json(`An error occurred while adding`)
                                            })
                                        }

                                    }

                                   await employee.updateGrossSalary(empId, gross).then((updateData)=>{
                                        if(!(_.isEmpty(updateData) || _.isNull(updateData)) ) {
                                            const logData = {
                                                "log_user_id": req.user.username.user_id,
                                                "log_description": "Updated salary structure",
                                                "log_date": new Date()
                                            }
                                            logs.addLog(logData).then((logRes)=>{
                                                //return res.status(200).json(logRes);
                                                return  res.status(200).json(`Action Successful`)
                                            })
                                        } else {
                                            salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                return res.status(400).json(`An error occurred while updating Employee's Gross`)
                                            })

                                        }
                                    })

                                }
                                else{

                                    await salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                        return res.status(400).json(`No Hazard Allowance Set for Employee Location`)
                                    })
                                }

                            }


                        }
                    }

                }

            }

        }
        else{
            return res.status(400).json(`Employee Doesn't Exists`)
        }
    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});



module.exports = router;
