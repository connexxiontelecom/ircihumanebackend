const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const timeAllocation =  require('../services/timeAllocationService')

const timeSheet =  require('../services/timeSheetService')
const logs = require('../services/logService')

const authorizationAction = require('../services/authorizationActionService');

/* Add to time sheet */
router.post('/add-time-allocation', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            ta_emp_id: Joi.number().required(),
            ta_month: Joi.string().required(),
            ta_year: Joi.string().required(),
            ta_tcode: Joi.string().required(),
            ta_charge: Joi.number().precision(2).required(),
            ta_ref_no: Joi.string().required()
                  })

        const timeAllocationRequest = req.body
        const validationResult = schema.validate(timeAllocationRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

            timeAllocation.addTimeAllocation(timeAllocationRequest).then((data)=>{
                //supervisorAssignmentService.getEmployeeSupervisor(leaveApplicationRequest.leapp_empid);
                authorizationAction.registerNewAction(2,data.ta_ref_no, 2,0,"Time allocation/time sheet initialized.")
                    .then((val)=>{
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added Time Allocation",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes)=>{
                            return res.status(200).json('Action Successful')
                        })
                    })
            })

    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

router.get('/get-time-allocation/:emp_id/:date', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)
        let day = date.getDate()
        let month = date.getMonth()+1
        let year = date.getFullYear()

        const timeAllocationSum  = await timeAllocation.sumTimeAllocation(empId, month, year).then((data)=>{
                return data
        })

        const timeAllocationBreakDown = await timeAllocation.findTimeAllocationsDetail(empId, month, year).then((data)=>{
            return data
        })

        const responseData = {
            timeAllocationSum: timeAllocationSum,
            timeAllocationBreakDown: timeAllocationBreakDown
        }

        return res.status(200).json(responseData)
    } catch (err) {
        console.error(`Error while fetching time allocation `, err.message);
        next(err);
    }
});



module.exports = router;
