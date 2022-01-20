const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const timeAllocation =  require('../services/timeAllocationService')
const employee = require('../services/employeeService')
const payrollMonthYear =  require('../services/payrollMonthYearService')
const publicHolidays = require('../services/publicHolidayServiceSetup')
const timeSheet =  require('../services/timeSheetService')
const logs = require('../services/logService')


/* Add to time sheet */
router.post('/add-time-allocation', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            ta_emp_id: Joi.number().required(),
            ta_month: Joi.string().required(),
            ta_year: Joi.string().required(),
            ta_tcode: Joi.string().required(),
            ta_charge: Joi.number().precision(2).required(),
                  })

        const timeAllocationRequest = req.body
        const validationResult = schema.validate(timeAllocationRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

            timeAllocation.addTimeAllocation(timeAllocationRequest).then((data)=>{

                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Added Time Allocation",
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{
                    return res.status(200).json('Action Successful')
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

        timeAllocation.sumTimeAllocation(empId, month, year).then((data)=>{

            return res.status(200).json(data)
        })
    } catch (err) {
        console.error(`Error while fetching time allocation `, err.message);
        next(err);
    }
});

router.get('/preload-date/:emp_id', auth,  async function(req, res, next) {
    try {
        const empId = req.params.emp_id


        await employee.getEmployee(empId).then((data)=>{
            if(_.isEmpty(data) || _.isNull(data)){

            }else{


               payrollMonthYear.findPayrollMonthYear().then((data) => {
                   if(_.isEmpty(data) || _.isNull(data)){

                   }
                   else
                       {


                       let payrollMonth = parseInt(data.pym_month) - 1
                       let pm = parseInt(data.pym_month)
                       let payrollYear = data.pym_year
                       let daysInMonth = getDaysInMonth(payrollMonth, payrollYear)
                       const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                       let d;
                       let dayNumber;
                       let timeObject = { }
                           let checkSpecificPubHols

                       daysInMonth.forEach((day)=>{
                           d = day
                           dayNumber = d.getDate()



                           if(weekday[d.getDay()] === 'Saturday' || weekday[d.getDay()] === 'Sunday' ){





                           }else{
                               checkSpecificPubHols = getSpecificHoliday(dayNumber, pm, payrollYear)
                               if(_.isEmpty(checkSpecificPubHols) || _.isNull(checkSpecificPubHols)){
                                   if(weekday[d.getDay()] !== 'Friday'){

                                       console.log(`i am not friday ${weekday[d.getDay()]}`)
                                       timeObject = {
                                           ts_emp_id: empId,
                                           ts_month: pm,
                                           ts_year: payrollYear,
                                           ts_day: dayNumber,
                                           ts_start: '08:00',
                                           ts_end: '17:00',
                                           ts_duration: '8.25'
                                       }

                                       console.log(timeObject)
                                       // timeSheet.addTimeSheet(timeObject).then((addTimeSheetRes)=>{
                                       //     console.log(addTimeSheetRes)
                                       // })
                                   }
                                   else{

                                       console.log(`i am  friday ${weekday[d.getDay()]}`)
                                       timeObject = {
                                           ts_emp_id: empId,
                                           ts_month: pm,
                                           ts_year: payrollYear,
                                           ts_day: dayNumber,
                                           ts_start: '08:00',
                                           ts_end: '15:00',
                                           ts_duration: 7.0


                                       }

                                       console.log(timeObject)
                                       // timeSheet.addTimeSheet(timeObject).then((addTimeSheetRes)=>{
                                       //     console.log(addTimeSheetRes)
                                       // })

                                   }

                                   timeSheet.addTimeSheet(timeObject).then((addTimeSheetRes)=>{
                                       console.log(addTimeSheetRes)
                                   })
                               }
                           }
                       })

                       return  res.status(200).json(daysInMonth)

                   }

               })

            }

        })


    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

function getDaysInMonth(month, year) {
    let date = new Date(year, month, 1);
    let days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}


async function getSpecificHoliday(day, month, year){
    return await publicHolidays.fetchSpecificPublicHoliday(day, month, year).then((data) => {
        return data
    })
}

module.exports = router;
