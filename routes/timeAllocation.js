const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const timeAllocation = require('../services/timeAllocationService')

const timeSheet = require('../services/timeSheetService')
const logs = require('../services/logService')
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const authorizationAction = require('../services/authorizationActionService');
const employee = require("../services/employeeService");


router.get('/', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const timeAllocationBreakDown = await timeAllocation.findAllTimeAllocations().then((data) => {
            return data
        })

        return res.status(200).json(timeAllocationBreakDown)
    } catch (err) {
        return res.status(400).json(`Error while fetching time allocation `);

    }
});
/* Add to time sheet */
router.post('/add-time-allocation', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            ta_emp_id: Joi.number().required(),
            ta_month: Joi.string().required(),
            ta_year: Joi.string().required(),
            ta_tcode: Joi.string().required(),
            ta_charge: Joi.number().precision(2).required(),
            ta_t0_code: Joi.string().required(),
            ta_t0_percent: Joi.number().required(),
            ta_ref_no: Joi.string().required()
        })

        const timeAllocationRequest = req.body
        const validationResult = schema.validate(timeAllocationRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
      const employeeData = await employee.getEmployee(req.body.ta_emp_id).then((data) => {
        return data
      })
      if(_.isNull(employeeData) || _.isEmpty(employeeData)){
        return res.status(400).json("Employee does not exist.");
      }
      if(_.isNull(employeeData.emp_supervisor_id) || _.isEmpty(employeeData.emp_supervisor_id)){
        return res.status(400).json("Employee currently has no supervisor");
      }
        /*supervisorAssignmentService.getEmployeeSupervisor(req.body.ta_emp_id).then((sup) => {
            if (sup) {*/
                timeAllocation.addTimeAllocation(timeAllocationRequest).then((data) => {
                    authorizationAction.registerNewAction(2, data.ta_ref_no, employeeData.emp_supervisor_id, 0, "Time allocation/time sheet initialized.")
                        .then((val) => {
                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Added Time Allocation",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes) => {
                                return res.status(200).json('Action Successful')
                            })
                        })
                })
           /* } else {
                return res.status(400).json("You currently have no supervisor assigned to you.");
            }
        });*/

    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});


router.post('/update-time-allocation', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            ta_emp_id: Joi.number().required(),
            ta_month: Joi.string().required(),
            ta_year: Joi.string().required(),
            ta_tcode: Joi.string().required(),
            ta_charge: Joi.number().precision(2).required(),
            ta_ref_no: Joi.string().required(),
            ta_t0_code: Joi.string().required(),
            ta_t0_percent: Joi.number().required(),
        })

        const timeAllocationRequest = req.body
        const validationResult = schema.validate(timeAllocationRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const supervise = await supervisorAssignmentService.getEmployeeSupervisor(req.body.ta_emp_id).then((sup) => {
            return sup;
        });
        if (supervise) {
            const destroyTimeAllo = await timeAllocation.deleteTimeAllocation(timeAllocationRequest).then((deldata) => {
                return deldata;
            });

            const timeall = await timeAllocation.addTimeAllocation(timeAllocationRequest).then((data) => {
                return data;
            });
            const auth = await authorizationAction.registerNewAction(2, timeall.ta_ref_no, supervise.sa_supervisor_id, 0, "Time allocation/time sheet initialized.")
                .then((val) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Added Time Allocation",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {
                        //return res.status(200).json('Action Successful')
                    })
                });
            return res.status(200).json('Action Successful')
        } else {
            return res.status(400).json("You currently have no supervisor assigned to you.");
        }

    } catch (err) {
        return res.status(400).error(`Error while adding time sheet `);

    }
});


router.get('/get-time-allocation/:emp_id/:date', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const timeAllocationSum = await timeAllocation.sumTimeAllocation(empId, month, year).then((data) => {
            return data
        })

        const timeAllocationBreakDown = await timeAllocation.findTimeAllocationsDetail(empId, month, year).then((data) => {
            return data
        })

        const responseData = {
            timeAllocationSum: timeAllocationSum,
            timeAllocationBreakDown: timeAllocationBreakDown
        }

        return res.status(200).json(responseData)
    } catch (err) {
        return res.status(400).json(`Error while fetching time allocation `);
        next(err);
    }
});


router.get('/get-employee-time-allocation/:emp_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const timeAllocationBreakDown = await timeAllocation.findTimeAllocationsEmployee(empId).then((data) => {
            return data
        })

        return res.status(200).json(timeAllocationBreakDown)
    } catch (err) {
        return res.status(400).json(`Error while fetching time allocation `);
        next(err);
    }
});

router.get('/authorization/:super_id', auth, async function (req, res, next) {
    try {

        let super_id = req.params.super_id
        let ref_no = [];
        let timeObj = {};
        await authorizationAction.getAuthorizationByOfficerId(super_id, 2).then((data) => {
            data.map((da) => {
                ref_no.push(da.auth_travelapp_id)
            });
        })
        await timeAllocation.findTimeAllocationsByRefNo(ref_no).then((data) => {
            authorizationAction.getAuthorizationLog(ref_no, 2).then((officers) => {
                timeObj = {
                    data,
                    officers
                }
                return res.status(200).json(timeObj);
            });
        })

    } catch (err) {
        res.status(400).json(`Error while fetching time allocation `);
        next(err);
    }
});


module.exports = router;
