const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {format} = require('date-fns');
const  differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const timeSheet =  require('../services/timeSheetService')
const { addLeaveAccrual, computeLeaveAccruals } = require("../routes/leaveAccrual")
const logs = require('../services/logService')


/* Add to time sheet */
router.post('/add-time-sheet', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            ts_emp_id: Joi.number().required(),
            ts_month: Joi.string().required(),
            ts_year: Joi.string().required(),
            ts_day: Joi.string().required(),
            ts_start: Joi.string().required(),
            ts_end: Joi.string().required(),
            ts_duration: Joi.number().required(),
             })

        const timeSheetRequest = req.body
        const validationResult = schema.validate(timeSheetRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

            timeSheet.findTimeSheet(timeSheetRequest.ts_emp_id, timeSheetRequest.ts_day, timeSheetRequest.ts_month, timeSheetRequest.ts_year).then((data)=>{
                if(_.isEmpty(data)){
                    timeSheet.addTimeSheet(timeSheetRequest).then((data) => {
                        return res.status(200).json('Action Successful')
                    })
                }else{

                    timeSheet.updateTimeSheet(data[0].ts_id, timeSheetRequest).then((data)=>{
                        return res.status(200).json('Action Successful with update')
                    })
                }
            })

    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

router.get('/get-time-sheet/:emp_id/:date', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)


        let day = date.getDate()
        let month = date.getMonth()+1
        let year = date.getFullYear()

        timeSheet.findTimeSheet(empId, day, month, year).then((data)=>{
            return res.status(200).json(data[0])
        })



    } catch (err) {
        console.error(`Error while fetching time sheet `, err.message);
        next(err);
    }
});


module.exports = router;
