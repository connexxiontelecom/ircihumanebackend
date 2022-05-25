const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('../services/db');
const timeSheetPenalty = require('../services/timesheetPenaltyService');
const employeeService = require('../services/employeeService');
const logs = require('../services/logService');


/* Add to time sheet penalty */
router.get('/', auth(), async function (req, res) {
    try {
        const defaultCharges = await timeSheetPenalty.getTimeSheetPenalty().then((data) => {
            return data;
        });
        //return res.status(200).json('hello');

        let empIds = [];
        defaultCharges.map((charge) => {
            empIds.push(charge.tsp_emp_id);
        });
        const employees = await employeeService.getEmployeeList(empIds).then((emps) => {
            return emps;
        })
        let penaltyObj = {
            defaultCharges,
            employees
        };
        return res.status(200).json(penaltyObj);

    } catch (err) {
        return res.status(400).json(`Error while fetching default charges ` + err.message);

    }
});
/*
router.post('/add-time-sheet', auth(),  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            ts_emp_id: Joi.number().required(),
            ts_month: Joi.string().required(),
            ts_year: Joi.string().required(),
            ts_day: Joi.string().required(),
            ts_start: Joi.string().required(),
            ts_end: Joi.string().required(),
            ts_duration: Joi.number().required(),
            ts_is_present: Joi.number().required(),
        })

        const timeSheetRequest = req.body
        const validationResult = schema.validate(timeSheetRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let tsData = await findTimeSheet(timeSheetRequest.ts_emp_id, timeSheetRequest.ts_day, timeSheetRequest.ts_month, timeSheetRequest.ts_year)

        const lId = timeSheet.getLatestTimeSheet().then((latest)=>{
            return latest;
        });


        if(_.isEmpty(tsData)){
            await addTimeSheet(timeSheetRequest)
            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Added Time Sheet",
                "log_date": new Date()
            }
            logs.addLog(logData).then((logRes)=>{
                return res.status(200).json('Action Successful')
            })
        }else{
            await updateTimeSheet(tsData.ts_id, timeSheetRequest)
            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Added Time Sheet",
                "log_date": new Date()
            }
            logs.addLog(logData).then((logRes)=>{
                return res.status(200).json('Action Successful')
            })
        }
    } catch (err) {
        return res.status(400).json(`Error while adding time sheet `);
        next(err);
    }
});
*/


module.exports = router;
