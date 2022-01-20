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
const logs = require('../services/logService')


/* Get all Salary Structure */
router.get('/', auth,  async function(req, res, next) {
    try {

        salaryStructure.findSalaryStructures().then((data)=>{
            return res.status(200).json(data)
        })

    } catch (err) {

        console.log(err.message)

         next(err);
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

       employee.getEmployee(salaryStructureRequest.ss_empid).then((data)=>{
           if(!_.isEmpty(data) || !_.isNull(data)){
               salaryStructure.findSalaryStructure(salaryStructureRequest.ss_empid).then((data)=>{
                   if(_.isEmpty(data) || _.isNull(data)){
                       salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data)=>{
                           if(_.isEmpty(data) || _.isNull(data) ){
                               return res.status(400).json(`Salary Grade Doesn't Exists`)
                           }else{
                               let maximum = parseFloat(data.sg_maximum)
                               let minimum = parseFloat(data.sg_minimum)
                               let gross = parseFloat(salaryStructureRequest.ss_gross)

                               if((gross < minimum) || (gross > maximum)){
                                   return res.status(400).json(`Gross Salary not within grade band`)
                               }else{
                                   paymentDefinition.findCodeWithGross().then((grossPercentage)=>{
                                       if(_.isEmpty(grossPercentage) || _.isNull(grossPercentage)){

                                       }else{


                                           let salaryObject = {}
                                            let amount
                                            let percent
                                           for(const percentage of grossPercentage){
                                               percent = parseFloat(percentage.pd_pr_gross)
                                               amount = (percent/100)*gross

                                               salaryObject = {
                                                   ss_empid: salaryStructureRequest.ss_empid,
                                                   ss_pd: percentage.pd_id,
                                                   ss_amount: amount

                                               }

                                               salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                                   if(_.isEmpty(data) || _.isNull(data)){
                                                       salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                                                           return res.status(400).json(`An error occurred while adding`)
                                                       })
                                                   }
                                               })

                                           }

                                            employee.getEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                                                let employeeLocation = data.emp_location_id
                                               locationAllowance.findLocationAllowanceByLocationId(employeeLocation).then((hazardAllowances)=>{
                                                   if(!_.isEmpty(hazardAllowances) || !_.isNull(hazardAllowances)){
                                                       for(const allowance of hazardAllowances){

                                                           salaryObject = {
                                                               ss_empid: salaryStructureRequest.ss_empid,
                                                               ss_pd: allowance.la_payment_id,
                                                               ss_amount: allowance.la_amount

                                                           }

                                                           salaryStructure.addSalaryStructure(salaryObject).then((data)=>{
                                                               if(_.isEmpty(data) || _.isNull(data)){
                                                                   salaryStructure.deleteSalaryStructuresEmployee(salaryStructureRequest.ss_empid).then((data)=>{
                                                                       return res.status(400).json(`An error occurred while adding`)
                                                                   })
                                                               }
                                                           })

                                                       }
                                                       const logData = {
                                                           "log_user_id": req.user.username.user_id,
                                                           "log_description": "Added new salary structure",
                                                           "log_date": new Date()
                                                       }
                                                       logs.addLog(logData).then((logRes)=>{
                                                           //return res.status(200).json(logRes);
                                                           return  res.status(200).json(`Action Successful`)
                                                       })
                                                   } else{
                                                       const logData = {
                                                           "log_user_id": req.user.username.user_id,
                                                           "log_description": "Added new salary structure",
                                                           "log_date": new Date()
                                                       }
                                                       logs.addLog(logData).then((logRes)=>{
                                                           //return res.status(200).json(logRes);
                                                           return  res.status(200).json(`Action Successful`)
                                                       })
                                                   }
                                                })

                                            })

                                       }
                                   })
                              }

                           }

                       })
                   }
                   else{
                       return res.status(400).json(`Salary Structure already set, consider updating`)
                   }

               })

           }
           else{
               return res.status(400).json(`Employee Doesn't Exists`)
           }
       })



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

        employee.getEmployee(empId).then((data)=>{
            if(!_.isEmpty(data) || !_.isNull(data)){
                salaryStructure.findSalaryStructure(empId).then((data)=>{
                    if(_.isEmpty(data) || _.isNull(data)){


                        return res.status(400).json(`Salary Structure was never setup, consider setting up`)
                    }
                    else{
                        salaryGrade.findSalaryGrade(salaryStructureRequest.ss_grade).then((data)=>{
                            if(_.isEmpty(data) || _.isNull(data) ){
                                return res.status(400).json(`Salary Grade Doesn't Exists`)
                            }else{
                                let maximum = parseFloat(data.sg_maximum)
                                let minimum = parseFloat(data.sg_minimum)
                                let gross = parseFloat(salaryStructureRequest.ss_gross)

                                if((gross < minimum) || (gross > maximum)){
                                    return res.status(400).json(`Gross Salary not within grade band`)
                                }else{
                                    let basicSalary = (60/100)*gross
                                    let housingAllowance = (20/100)*gross
                                    let transportAllowance = (20/100)*gross

                                    const basicObject = {
                                        ss_empid: empId,
                                        ss_pd: 1,
                                        ss_amount: basicSalary,
                                    }

                                    const transportObject = {
                                        ss_empid: empId,
                                        ss_pd: 2,
                                        ss_amount: transportAllowance,
                                    }

                                    const housingObject = {
                                        ss_empid: empId,
                                        ss_pd: 3,
                                        ss_amount: housingAllowance,
                                    }
                                    salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                        salaryStructure.addSalaryStructure(basicObject).then((data)=>{
                                            if(!_.isEmpty(data) || !_.isNull(data)){
                                                salaryStructure.addSalaryStructure(transportObject).then((data)=>{
                                                    if(!_.isEmpty(data) || !_.isNull(data)){
                                                        salaryStructure.addSalaryStructure(housingObject).then((data)=>{
                                                            if(!_.isEmpty(data) || !_.isNull(data)){
                                                                const logData = {
                                                                    "log_user_id": req.user.username.user_id,
                                                                    "log_description": "Updated Salary Structure",
                                                                    "log_date": new Date()
                                                                }
                                                                logs.addLog(logData).then((logRes)=>{
                                                                    return res.status(200).json('Action Successful')
                                                                })
                                                            }else{
                                                                salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                                    return res.status(400).json(`An error occurred while adding`)
                                                                })

                                                            }
                                                        })
                                                    }else{
                                                        salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                            return res.status(400).json(`An error occurred while adding`)
                                                        })
                                                    }
                                                })
                                            }else {
                                                salaryStructure.deleteSalaryStructuresEmployee(empId).then((data)=>{
                                                    return res.status(400).json(`An error occurred while adding`)
                                                })
                                            }
                                        })
                                    })


                                }

                            }

                        })


                    }

                })

            }
            else{
                return res.status(400).json(`Employee Doesn't Exists`)
            }
        })
    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});



module.exports = router;
