const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()

const leaveAccrual =  require('../services/leaveAccrualService')
const leaveType = require('../services/leaveTypeService')
const employee = require("../services/employeeService");
const auth = require("../middleware/auth");
const leaveApplication = require("../services/leaveApplicationService");


    async function addLeaveAccrual(data) {
    const schema = Joi.object({

        lea_emp_id: Joi.number().required(),
        lea_month: Joi.number().required(),
        lea_year: Joi.number().required(),
        lea_leave_type: Joi.number().required(),
        lea_rate: Joi.number().precision(2).required()
    })

    const validationResult = schema.validate(data)
    if (validationResult.error) {
        return validationResult.error.details[0].message
    } else {
        return await leaveAccrual.addLeaveAccrual(data)
    }
}


async function removeLeaveAccrual(data) {


        return await leaveAccrual.removeLeaveAccrual(data)

}

    async function computeLeaveAccruals(data) {
    const schema = Joi.object({
        lea_emp_id: Joi.number().required(),
        lea_year: Joi.number().required(),
        lea_leave_type: Joi.number().required(),
      })

    const validationResult = schema.validate(data)
    if (validationResult.error) {
        return validationResult.error.details[0].message
    } else {

       return leaveAccrual.sumLeaveAccrualByYearEmployeeLeaveType(data.lea_year, data.lea_emp_id, data.lea_leave_type)
    }
}


router.get('/get-leave-acrruals/:emp_id', auth,  async function(req, res, next) {
    try {
        const empId = req.params.emp_id

        const d = new Date();
        const year = d.getFullYear();

        const employeeData =   await employee.getEmployee(empId).then((data)=>{
            return  data

        })

        if(!_.isEmpty(employeeData) || !_.isNull(employeeData)){


            const leaves = await leaveType.getAllLeaves().then((data)=>{
                return data
            })


            if(_.isEmpty(leaves) || _.isNull(leaves)){
                return res.status(400).json(`No leave set up`)
            }
            else{
                let responseData = [ ]
                for (const leave of leaves) {

                    let usedLeaveValue = 0

                    let usedLeavesData = await leaveApplication.sumLeaveUsedByYearEmployeeLeaveType(year, empId, leave.leave_type_id).then((sumLeave) => {
                        return sumLeave
                      })

                    if(!(_.isNull(usedLeavesData) || parseInt(usedLeavesData) === 0)){
                        usedLeaveValue = usedLeavesData
                    }

                        let leaveSumAccruals = await leaveAccrual.sumLeaveAccrualByYearEmployeeLeaveType(year, empId, leave.leave_type_id).then((data)=>{
                            return data
                        })

                        let accrualValue = 0;
                        if(!(_.isNull(leaveSumAccruals) || parseInt(leaveSumAccruals) === 0)){
                          accrualValue = leaveSumAccruals
                        }


                        const finalLeaveAccrualObject = {
                            leave: leave,
                            accrual: accrualValue - usedLeaveValue
                        }

                     responseData.push(finalLeaveAccrualObject)
               }

                return res.status(200).json(responseData)
            }

        }
        else{
            return res.status(400).json(`Employee Doesn't Exists`)
        }
    } catch (err) {
        console.error(`Error while Fetching `, err.message);
        next(err);
    }

});

module.exports = {
    router,
    addLeaveAccrual,
    computeLeaveAccruals,
    removeLeaveAccrual

}
