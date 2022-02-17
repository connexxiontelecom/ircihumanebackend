const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('../services/db');
const timeSheetModel =  require('../models/timesheet')(sequelize, Sequelize.DataTypes);
const timeSheet =  require('../services/timeSheetService');
const timeSheetAllocation =  require('../services/timeAllocationService')
const employee = require('../services/employeeService')
const payrollMonthYear =  require('../services/payrollMonthYearService')
const publicHolidays = require('../services/publicHolidayServiceSetup')
const supervisorAssignment = require('../services/supervisorAssignmentService');
const logs = require('../services/logService');
const authorizationAction = require('../services/authorizationActionService');


/* Add to time sheet */
router.get('/', auth,  async function(req, res, next) {
    try {
            const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
                return data
            })
            if (_.isEmpty(payrollMonthYearData) || _.isNull(payrollMonthYearData)) {
                return res.status(404).json(`No Payroll Month and Year Set`)
            } else {
                let payrollMonth = parseInt(payrollMonthYearData.pym_month)
                let payrollYear = payrollMonthYearData.pym_year

                const timeSheetData = await timeSheet.findTimeSheetByMonthOnly(payrollMonth, payrollYear).then((data) => {
                    return data
                })

                return res.status(200).json(timeSheetData)

            }

    } catch (err) {
        return res.status(400).json(`Error while fetching time sheet `);

    }
});
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
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

router.get('/get-time-sheet/:emp_id/:date', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)

             const employeeData =  await employee.getEmployee(empId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(404).json(`Employee Does Not Exist`)
        }else {
            let day = date.getDate()
            let month = date.getMonth() + 1
            let year = date.getFullYear()

            timeSheet.findTimeSheet(empId, day, month, year).then((data) => {
                return res.status(200).json(data)
            })
        }



    } catch (err) {
        console.error(`Error while fetching time sheet `, err.message);
        next(err);
    }
});

router.get('/get-time-sheet-month/:emp_id/:date', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)

        const employeeData =  await employee.getEmployee(empId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(404).json(`Employee Does Not Exist`)
        }else {

            let month = date.getMonth() + 1
            let year = date.getFullYear()

            await timeSheet.findTimeSheetMonthEmployee(empId, month, year).then((data) => {
                return res.status(200).json(data)
            })
        }



    } catch (err) {
        console.error(`Error while fetching time sheet `, err.message);
        next(err);
    }
});


router.get('/get-time-sheets/:emp_id', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData =  await employee.getEmployee(empId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(404).json(`Employee Does Not Exist`)
        }else {
            const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
                return data
            })
            if (_.isEmpty(payrollMonthYearData) || _.isNull(payrollMonthYearData)) {
                return res.status(404).json(`No Payroll Month and Year Set`)
            } else {
                let payrollMonth = parseInt(payrollMonthYearData.pym_month)
                let payrollYear = payrollMonthYearData.pym_year

                const timeSheetData = await timeSheet.findTimeSheetMonth(empId, payrollMonth, payrollYear).then((data) => {
                    return data
                })

                return res.status(200).json(timeSheetData)

            }
        }

     } catch (err) {
        return res.status(400).json(`Error while fetching time sheet `);

    }
});


router.get('/preload-date/:emp_id', auth,  async function(req, res, next) {
    try {
        const empId = req.params.emp_id

        const employeeData =  await employee.getEmployee(empId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(404).json(`Employee Does Not Exist`)
        }else{
            const payrollMonthYearData = await payrollMonthYear.findPayrollMonthYear().then((data) => {
              return data
            })
            if(_.isEmpty(payrollMonthYearData) || _.isNull(payrollMonthYearData)){
                return res.status(404).json(`No Payroll Month and Year Set`)
            }
            else{
                let payrollMonth = parseInt(payrollMonthYearData.pym_month) - 1
                let pm = parseInt(payrollMonthYearData.pym_month)
                let payrollYear = payrollMonthYearData.pym_year
                let daysInMonth = getDaysInMonth(payrollMonth, payrollYear)
                const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
                let d
                let dayNumber
                let timeObject = { }
                let checkSpecificPubHols
                let tsData = { }

                for (const day of daysInMonth) {
                    d = day
                    dayNumber = d.getDate()



                    if(weekday[d.getDay()] === 'Saturday' || weekday[d.getDay()] === 'Sunday' ){
                    }else{
                        checkSpecificPubHols = await getSpecificHoliday(dayNumber, pm, payrollYear)
                        if(_.isEmpty(checkSpecificPubHols) || _.isNull(checkSpecificPubHols)){
                            if(weekday[d.getDay()] !== 'Friday'){
                                timeObject = {
                                    ts_emp_id: empId,
                                    ts_month: pm,
                                    ts_year: payrollYear,
                                    ts_day: dayNumber,
                                    ts_start: '08:00',
                                    ts_end: '17:00',
                                    ts_duration: '8.25'
                                }
                            }
                            else{
                                timeObject = {
                                    ts_emp_id: empId,
                                    ts_month: pm,
                                    ts_year: payrollYear,
                                    ts_day: dayNumber,
                                    ts_start: '08:00',
                                    ts_end: '15:00',
                                    ts_duration: 7.0
                                }
                            }

                            tsData =  await findTimeSheet(empId, dayNumber, pm, payrollYear)

                            if(_.isEmpty(tsData)){
                                await addTimeSheet(timeObject)
                            }else{
                                await updateTimeSheet(tsData.ts_id, timeObject)
                            }
                        }
                    }
                }

                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Prefilled Time Sheet",
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{
                    return res.status(200).json('Action Successful')
                })
            }
        }

    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

router.get('/time-sheet/:month/:year/:emp_id', auth, async function (req, res) {
    try{
        const empId = parseInt(req.params.emp_id);
        const month = parseInt(req.params.month);
        const year = parseInt(req.params.year);
        const userId = req.user.username.user_id;
        const timeAllocation= await timeSheetAllocation.findTimeAllocationDetail(month, year,empId).then((data)=>{
            return data;
        })
        if(_.isNull(timeAllocation) || _.isEmpty(timeAllocation)){
            return res.status(404).json("No time allocation found.");
        }
          const timesheet = await  timeSheet.findTimeSheetMonth(empId, month, year).then((time)=>{
               return time;
            });
        if(_.isEmpty(timesheet) || _.isNull(timesheet)){
            return res.status(400).json("No time sheet record found.");
        }
           await  authorizationAction.getAuthorizationLog(timeAllocation.ta_ref_no, 2).then((log)=>{
                return res.status(200).json({timesheet, timeAllocation, log});
            })

    }catch (e) {
        return res.status(400).json("Whoops! Something went wrong. Try again."+e.message);
    }

});
router.get('/:month/:year', auth, async function (req, res) {
    try{
        //const empId = parseInt(req.params.emp_id);
        const month = parseInt(req.params.month);
        const year = parseInt(req.params.year);
   //     const userId = req.user.username.user_id;
        const timeAllocation= await timeSheetAllocation.findTimeAllocationDetailMonthYear(month, year).then((data)=>{
            return data;
        })
        if(_.isNull(timeAllocation) || _.isEmpty(timeAllocation)){
            return res.status(404).json("No time allocation found.");
        }
          const timesheet = await  timeSheet.findTimeSheetByMonthOnly(month, year).then((time)=>{
               return time;
            });
        if(_.isEmpty(timesheet) || _.isNull(timesheet)){
            return res.status(400).json("No time sheet record found.");
        }

           await  authorizationAction.getAuthorizationLog(timeAllocation.ta_ref_no, 2).then((log)=>{
                return res.status(200).json({timesheet, timeAllocation, log});
            })

    }catch (e) {
        return res.status(400).json("Whoops! Something went wrong. Try again.");
    }

});
/*

router.get('/:month/:year', auth, async function (req, res) {
    try{
        //const empId = parseInt(req.params.emp_id);
        const month = parseInt(req.params.month);
        const year = parseInt(req.params.year);
        const userId = req.user.username.user_id;
        await timeSheetAllocation.findTimeAllocationDetailMonthYear(month, year).then((timeAllocation)=>{
            if(_.isNull(timeAllocation) || _.isEmpty(timeAllocation)){
                return res.status(404).json("No time allocation found.");
            }else{
                timeSheet.findTimeSheetByMonthOnly(month, year).then((timesheet)=>{
                    if(_.isEmpty(timesheet) || _.isNull(timesheet)){
                        return res.status(400).json("No time sheet record found.");
                    }else{
                        authorizationAction.getAuthorizationLog(timeAllocation.ta_ref_no, 2).then((log)=>{
                            return res.status(200).json({timesheet, timeAllocation, log});
                        })
                    }
                });
            }
        })
    }catch (e) {
        return res.status(400).json("Whoops! Something went wrong. Try again."+e.message);
    }

});
*/


router.post('/update-status', auth, async function (req, res) {
    //status, comment, month, year, empId, officer(logged in person)
    try{
        const schema = Joi.object( {
            comment: Joi.string().required(),
            status: Joi.number().required(),
            month: Joi.number().required(),
            year: Joi.number().required(),
            employee: Joi.number().required()
        })

        const timeSheetRequest = req.body
        const validationResult = schema.validate(timeSheetRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const {employee, month, year, comment, status} = req.body;
        const userId = req.user.username.user_id;
        supervisorAssignment.getEmployeeSupervisor(employee).then((data)=>{
            if(data){
                if(userId !== data.sa_supervisor_id) return res.status(404).json({message: "Access denied. You're not the assigned supervisor to this employee."});
                const randStr = Math.random().toString(36).substr(2, 5);
                timeSheet.findTimeSheetMonth(employee, month, year).then((timeS)=>{
                   timeS.map((time)=>{
                       //return res.status(200).json({message: time});
                       timeSheet.updateTimeSheetStatus(comment, userId, status, randStr, time.ts_id).then((data)=>{
                           console.log(`Data updated: ${ data } AND ID: ${ time.ts_id }`);
                       });
                   });

                });
                return res.status(200).json({message:`Time sheet updated successfully.`});
            }else{
                return res.status(400).json({message: "There's no supervisor assigned to this employee. Contact admin or HR."});
            }
        })
    }catch (e) {
        return res.status(400).json({message: "Something went wrong. Try again."});
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

async function addTimeSheet(timeSheetData){
    return await timeSheet.addTimeSheet(timeSheetData).then((data)=>{
        return data
    })
}

async function findTimeSheet(empId, day, month, year){
    return await timeSheet.findTimeSheet(empId, day, month, year).then((data)=>{
        return data
    })
}


async function updateTimeSheet(timeSheetId, timeSheetData){
  return await timeSheet.updateTimeSheet(timeSheetId, timeSheetData).then((data)=>{
      return data
  })
}

router.get('/authorization/supervisor/:id',auth, async (req, res)=>{
    try{
        const supervisorId = req.params.id;
        await authorizationAction.getAuthorizationByOfficerId(supervisorId,2).then((data)=>{

            ;
            const ids = [];
            data.map((app)=>{
                ids.push(app.auth_travelapp_id);
            });
            const month = [];
            const year = [];
            timeSheetAllocation.getTimeAllocationApplicationsForAuthorization(ids).then((info)=>{
                info.map((n)=>{
                    month.push(n.ta_month);
                    year.push(n.ta_year);
                });

                timeSheet.getTimeSheetApplicationsForAuthorization(month, year).then((r)=>{
                    return res.status(200).json(r);
                })

            });
        })
    }catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});



module.exports = router;
