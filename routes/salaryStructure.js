const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const salaryGrade = require('../services/salaryGradeService')
const salaryStructure = require('../services/salaryStructureService')
const paymentDefinition = require('../services/paymentDefinitionService')
const employee = require('../services/employeeService')
const locationAllowance = require('../services/locationAllowanceService')
const logs = require('../services/logService')


/* Get all Salary Structure */
router.get('/', auth, async function (req, res, next) {
    try {

        salaryStructure.findSalaryStructures().then((data) => {
            return res.status(200).json(data)
        })

    } catch (err) {

        console.log(err.message)

        next(err);
    }
});


/* Add to Salary structure */
router.post('/add-salary-structure', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            ss_empid: Joi.number().required(),
            ss_gross: Joi.number().precision(2).required(),
            ss_grade: Joi.number().required(),
        })

        const salaryStructureRequest = req.body
        const validationResult = schema.validate(salaryStructureRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let empId = salaryStructureRequest.ss_empid

        const employeeData = await employee.getEmployee(empId).then((data) => {
            return data
        })

        if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
            const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data) => {
                return data
            })

            if (!(_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure))) {
                return res.status(400).json(`Salary Structure already set up, consider updating`)
            } else {
                const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data) => {
                    return data
                })

                if (_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade)) {
                    return res.status(400).json(`Salary Grade Doesn't Exists`)
                } else {
                    let maximum = parseFloat(empSalaryGrade.sg_maximum)
                    let minimum = parseFloat(empSalaryGrade.sg_minimum)
                    let gross = parseFloat(salaryStructureRequest.ss_gross)

                    const grossPercentage = await paymentDefinition.findCodeWithGross().then((data) => {
                        return data
                    })

                    if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
                        return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)
                    } else {
                        let totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) => {
                            return data
                        })

                        if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
                            return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)

                        } else {
                            await salaryStructure.deleteSalaryStructuresEmployee(empId).then()
                            await employee.updateGrossSalary(empId, 0).then()

                            let salaryObject = {}
                            let amount
                            let percent
                            for (const percentage of grossPercentage) {
                                percent = parseFloat(percentage.pd_pr_gross)
                                amount = (percent / 100) * gross

                                salaryObject = {
                                    ss_empid: empId,
                                    ss_pd: percentage.pd_id,
                                    ss_amount: amount,
                                    ss_grade: salaryStructureRequest.ss_grade

                                }

                                await salaryStructure.addSalaryStructure(salaryObject).then((data) => {
                                    if (_.isEmpty(data) || _.isNull(data)) {
                                        salaryStructure.deleteSalaryStructuresEmployee(empId).then((data) => {
                                            return res.status(400).json(`An error occurred while adding`)
                                        })
                                    }
                                })

                                await employee.updateGrossSalary(empId, gross).then((updateData) => {
                                    if (!(_.isEmpty(updateData) || _.isNull(updateData))) {
                                        const logData = {
                                            "log_user_id": req.user.username.user_id,
                                            "log_description": "Updated salary structure",
                                            "log_date": new Date()
                                        }
                                        logs.addLog(logData).then((logRes) => {
                                            //return res.status(200).json(logRes);
                                            return res.status(200).json(`Action Successful`)
                                        })
                                    } else {
                                        salaryStructure.deleteSalaryStructuresEmployee(empId).then((data) => {
                                            return res.status(400).json(`An error occurred while updating Employee's Gross`)
                                        })

                                    }
                                })


                            }

                            // const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(employeeData.emp_location_id).then((data)=>{
                            //     return data
                            // })
                            //
                            // if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)){
                            //     for(const allowance of hazardAllowances){
                            //
                            //         salaryObject = {
                            //             ss_empid: empId,
                            //             ss_pd: allowance.la_payment_id,
                            //             ss_amount: allowance.la_amount
                            //
                            //         }
                            //
                            //         let salaryStructureAddResponse = await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                            //             return  data
                            //
                            //         })
                            //
                            //         if(_.isEmpty(salaryStructureAddResponse) || _.isNull(salaryStructureAddResponse)){
                            //             await salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                            //                 return res.status(400).json(`An error occurred while adding`)
                            //             })
                            //         }
                            //
                            //     }
                            //
                            //     await employee.updateGrossSalary(empId, gross).then((updateData)=>{
                            //         if(!(_.isEmpty(updateData) || _.isNull(updateData)) ) {
                            //             const logData = {
                            //                 "log_user_id": req.user.username.user_id,
                            //                 "log_description": "Updated salary structure",
                            //                 "log_date": new Date()
                            //             }
                            //             logs.addLog(logData).then((logRes)=>{
                            //                 //return res.status(200).json(logRes);
                            //                 return  res.status(200).json(`Action Successful`)
                            //             })
                            //         } else {
                            //             salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                            //                 return res.status(400).json(`An error occurred while updating Employee's Gross`)
                            //             })
                            //
                            //         }
                            //     })
                            //
                            // }
                            // else{
                            //
                            //     await salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                            //         return res.status(400).json(`No Hazard Allowance Set for Employee Location`)
                            //     })
                            // }

                        }


                    }
                    // if ((gross < minimum) || (gross > maximum)) {
                    //     return res.status(400).json(`Gross Salary not within grade band`)
                    // } else {
                    //
                    // }

                }

            }

        } else {
            return res.status(400).json(`Employee Doesn't Exists`)
        }


    } catch (err) {
        console.error(`Error while adding salary structure `, err.message);
        next(err);
    }
});


/* Update Salary Structure */
router.patch('/update-salary-structure/:emp_id', auth, async function (req, res, next) {
    try {
        const empId = req.params.emp_id
        const schema = Joi.object({
            ss_gross: Joi.number().precision(2).required(),
            ss_grade: Joi.number().required(),
        })

        const salaryStructureRequest = req.body
        const validationResult = schema.validate(salaryStructureRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const employeeData = await employee.getEmployee(empId).then((data) => {
            return data

        })

        if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
            const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data) => {
                return data
            })
            if (_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure)) {
                return res.status(400).json(`Salary Structure was never setup, consider setting up`)
            } else {
                const empSalaryGrade = await salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data) => {
                    return data
                })
                if (_.isEmpty(empSalaryGrade) || _.isNull(empSalaryGrade)) {
                    return res.status(400).json(`Salary Grade Doesn't Exists`)
                } else {
                    let maximum = parseFloat(empSalaryGrade.sg_maximum)
                    let minimum = parseFloat(empSalaryGrade.sg_minimum)
                    let gross = parseFloat(salaryStructureRequest.ss_gross)

                    const grossPercentage = await paymentDefinition.findCodeWithGross().then((data) => {
                        return data
                    })

                    if (_.isEmpty(grossPercentage) || _.isNull(grossPercentage)) {
                        return res.status(400).json(`Update Payment Definitions to include Gross Percentage`)
                    } else {
                        let totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) => {
                            return data
                        })

                        if (parseFloat(totalPercentageGross) > 100 || parseFloat(totalPercentageGross) < 100) {
                            return res.status(400).json(`Update Payment Definitions Gross Percentage to sum to 100%`)

                        } else {
                            await salaryStructure.deleteSalaryStructuresEmployee(empId).then()

                            await employee.updateGrossSalary(empId, 0).then()
                            let salaryObject = {}
                            let amount
                            let percent
                            for (const percentage of grossPercentage) {
                                percent = parseFloat(percentage.pd_pr_gross)
                                amount = (percent / 100) * gross

                                salaryObject = {
                                    ss_empid: empId,
                                    ss_pd: percentage.pd_id,
                                    ss_amount: amount,
                                    ss_grade: salaryStructureRequest.ss_grade

                                }

                                await salaryStructure.addSalaryStructure(salaryObject).then((data) => {
                                    if (_.isEmpty(data) || _.isNull(data)) {
                                        salaryStructure.deleteSalaryStructuresEmployee(empId).then((data) => {
                                            return res.status(400).json(`An error occurred while adding`)
                                        })
                                    }
                                })

                            }
                            await employee.updateGrossSalary(empId, gross).then((updateData) => {
                                if (!(_.isEmpty(updateData) || _.isNull(updateData))) {
                                    const logData = {
                                        "log_user_id": req.user.username.user_id,
                                        "log_description": "Updated salary structure",
                                        "log_date": new Date()
                                    }
                                    logs.addLog(logData).then((logRes) => {
                                        //return res.status(200).json(logRes);
                                        return res.status(200).json(`Action Successful`)
                                    })
                                } else {
                                    salaryStructure.deleteSalaryStructuresEmployee(empId).then((data) => {
                                        return res.status(400).json(`An error occurred while updating Employee's Gross`)
                                    })

                                }
                            })

                            // const hazardAllowances = await locationAllowance.findLocationAllowanceByLocationId(employeeData.emp_location_id).then((data)=>{
                            //     return data
                            // })
                            //
                            // if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)){
                            //     for(const allowance of hazardAllowances){
                            //
                            //         salaryObject = {
                            //             ss_empid: empId,
                            //             ss_pd: allowance.la_payment_id,
                            //             ss_amount: allowance.la_amount
                            //
                            //         }
                            //
                            //         let salaryStructureAddResponse = await salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                            //             return  data
                            //
                            //         })
                            //
                            //         if(_.isEmpty(salaryStructureAddResponse) || _.isNull(salaryStructureAddResponse)){
                            //             await salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                            //                 return res.status(400).json(`An error occurred while adding`)
                            //             })
                            //         }
                            //
                            //     }
                            //
                            //    await employee.updateGrossSalary(empId, gross).then((updateData)=>{
                            //         if(!(_.isEmpty(updateData) || _.isNull(updateData)) ) {
                            //             const logData = {
                            //                 "log_user_id": req.user.username.user_id,
                            //                 "log_description": "Updated salary structure",
                            //                 "log_date": new Date()
                            //             }
                            //             logs.addLog(logData).then((logRes)=>{
                            //                 //return res.status(200).json(logRes);
                            //                 return  res.status(200).json(`Action Successful`)
                            //             })
                            //         } else {
                            //             salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                            //                 return res.status(400).json(`An error occurred while updating Employee's Gross`)
                            //             })
                            //
                            //         }
                            //     })
                            //
                            // }
                            // else{
                            //
                            //     await salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                            //         return res.status(400).json(`No Hazard Allowance Set for Employee Location`)
                            //     })
                            // }

                        }


                    }

                    // if ((gross < minimum) || (gross > maximum)) {
                    //     return res.status(400).json(`Gross Salary not within grade band`)
                    // } else {
                    //
                    // }

                }

            }

        } else {
            return res.status(400).json(`Employee Doesn't Exists`)
        }
    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});


router.get('/get-salary-structure/:emp_id', auth, async function (req, res, next) {
    try {
        const empId = req.params.emp_id


        const employeeData = await employee.getEmployee(empId).then((data) => {
            return data

        })

        if (!_.isEmpty(employeeData) || !_.isNull(employeeData)) {
            const empSalaryStructure = await salaryStructure.findSalaryStructure(empId).then((data) => {
                return data
            })

            if (_.isEmpty(empSalaryStructure) || _.isNull(empSalaryStructure)) {
                return res.status(400).json(`Salary Structure was never setup, consider setting up`)
            } else {
                return res.status(200).json(empSalaryStructure)
            }

        } else {
            return res.status(400).json(`Employee Doesn't Exists`)
        }
    } catch (err) {
        console.error(`Error while Fetching `, err.message);
        next(err);
    }

});


module.exports = router;
