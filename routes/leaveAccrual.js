const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const leaveAccrual =  require('../services/leaveAccrualService')



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
        return leaveAccrual.addLeaveAccrual(data)
    }
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



module.exports = {
    router,
    addLeaveAccrual,
    computeLeaveAccruals

}
