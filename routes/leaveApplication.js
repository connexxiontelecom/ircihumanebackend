const {sequelize, Sequelize} = require('../services/db');
const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {format} = require('date-fns');
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const differenceInDays = require('date-fns/differenceInDays')
const isBefore = require('date-fns/isBefore')
const leaveApplication = require('../services/leaveApplicationService')
const {addLeaveAccrual, computeLeaveAccruals} = require("../routes/leaveAccrual");
const leaveAccrualService = require("../services/leaveAccrualService");
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const leaveTypeService = require('../services/leaveTypeService');
const IRCMailerService = require('../services/IRCMailer');
const hrFocalPointModel = require("../models/hrfocalpoint")(sequelize, Sequelize.DataTypes);
const leaveAppModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')
const employees = require("../services/employeeService");
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);

/* Get leave application */
router.get('/', auth(), async function (req, res, next) {
    try {
        let appId = [];
        let leaveObj = {};
        await leaveApplication.findAllLeaveApplication().then((data) => {
            data.map((app) => {
                appId.push(app.leapp_id);
            });
            authorizationAction.getAuthorizationLog(appId, 1).then((officers) => {
                leaveObj = {
                    data,
                    officers
                };
                return res.status(200).json(leaveObj);
            });
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching leaves ${err.message}`)
    }
});

/* Add Location Allowance */
router.post('/add-leave-application', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            leapp_empid: Joi.number().required(),
            leapp_leave_type: Joi.number().required(),
            leapp_start_date: Joi.string().required(),
            leapp_end_date: Joi.string().required(),
            leapp_alt_email: Joi.string(),
            leapp_alt_phone: Joi.string()
            // leapp_verify_by: Joi.number().required(),
            // leapp_verify_date: Joi.string().required(),
            // leapp_verify_comment: Joi.string().required(),
            // leapp_recommend_by: Joi.number().required(),
            // leapp_recommend_date: Joi.string().required(),
            // leapp_recommend_comment: Joi.string().required(),
            // leapp_approve_by: Joi.number().required(),
            // leapp_approve_date: Joi.string().required(),
            // leapp_approve_comment: Joi.string().required(),
            // leapp_status: Joi.string().required(),
        })

        const leaveApplicationRequest = req.body
        const validationResult = schema.validate(leaveApplicationRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }


        let startDate = new Date(leaveApplicationRequest.leapp_start_date);
        let startYear = startDate.getFullYear();

        let endDate = new Date(leaveApplicationRequest.leapp_end_date);
        let endYear = endDate.getFullYear();

        if (isBefore(startDate, new Date())) {
            return res.status(400).json('Leave start date cannot be before today or today')
        }

        // if (String(startYear) !== String(endYear)) {
        //     return res.status(400).json('Leave period must be within the same year')
        // }


        let daysRequested = await differenceInBusinessDays(endDate, startDate)
        const empId = req.user.username.user_id;
        if (parseInt(daysRequested) <= 0) {
            return res.status(400).json('Leave duration must be greater or equal to 1')
        }

        const emp = await employees.getEmployeeByIdOnly(parseInt(leaveApplicationRequest.leapp_empid)).then((ed) => {
            return ed;
        });
        if (_.isEmpty(emp) || (_.isNull(emp))) {
            return res.status(400).json("Employee does not exist");
        }

        const hrpoints = await hrFocalPointModel.getHrFocalPointsByLocationId(emp.emp_location_id);
        if (_.isEmpty(hrpoints) || _.isNull(hrpoints)) return res.status(400).json("There're currently no HR Focal Points at this location");
        /*

        const supervisorAssignment = await supervisorAssignmentService.getEmployeeSupervisor(leaveApplicationRequest.leapp_empid).then((val) => {
            return val
        });

        if (_.isEmpty(supervisorAssignment) || _.isNull(supervisorAssignment)) {
            return res.status(400).json('You currently have no supervisor assigned to you. Contact admin.');
        }
*/

        const leaveTypeData = await leaveTypeService.getLeaveType(leaveApplicationRequest.leapp_leave_type).then((data) => {
            return data
        })

        if (_.isEmpty(leaveTypeData) || (_.isNull(leaveTypeData))) {
            return res.status(400).json('Invalid Leave Type');

        }
      if(daysRequested > parseInt(leaveTypeData.leave_duration)){
        return res.status(400).json('Leave duration exceed leave duration for this leave type.')
      }

        if (parseInt(leaveTypeData.lt_accrue) === 1) {
            const accrualData = {
                lea_emp_id: leaveApplicationRequest.leapp_empid,
                lea_year: startYear,
                lea_leave_type: leaveApplicationRequest.leapp_leave_type,

            }

            const accruedDays = await computeLeaveAccruals(accrualData).then((data) => {
                return data
            });


            if (_.isNull(accruedDays) || accruedDays === 0) {
                return res.status(400).json('No Leave Accrued for Selected Leave')
            }


           if (parseInt(daysRequested) > parseInt(accruedDays)) {
                return res.status(400).json("Days Requested Greater than Accrued Days")
            }
        }

        leaveApplicationRequest['leapp_year'] = startYear
        leaveApplicationRequest['leapp_total_days'] = daysRequested
        leaveApplicationRequest['leapp_status'] = 0;


        const leaveApplicationResponse = await leaveApplication.addLeaveApplication(leaveApplicationRequest).then((data) => {

            return data
        })

        const leaveAppId = leaveApplicationResponse.leapp_id;
        hrpoints.map(async (hrp) => {
          const subject = "New leave application";
          const body = "Kindly attend to this leave application.";
          //emp
          const authorizationResponse = authorizationAction.registerNewAction(1, leaveAppId, hrp.hfp_emp_id, 0, "Leave application initiated").then((data) => {
            return data
          });
          const url = req.headers.referer;
          //const notify = await notificationModel.registerNotification(subject, body, employeeData.emp_id, 11, url);
          const notifySupervisor = await notificationModel.registerNotification(subject, body, hrp.hfp_emp_id, 0, url);

        })

      //send mail
      const subject = 'Leave application';
      const body = "Your leave application was received. ";
      await IRCMailerService.sendMail('no-reply@irc.com',emp.emp_office_email,subject, body);

        /* if (_.isEmpty(authorizationResponse) || (_.isNull(authorizationResponse))) {
             return res.status(400).json('An Error Occurred')
         }*/

        return res.status(200).json(leaveApplicationResponse)

    } catch (err) {
        console.error(`Error while adding location allowance `, err.message);
        next(err);
    }
});

//Get approved application
router.get('/approved-applications', async (req, res) => {
    try {
        let appId = [];
        let leaveObj = {};
        await leaveApplication.findAllActiveLeaveApplications().then((data) => {
            data.map((app) => {
                appId.push(app.leapp_id);
            });
            authorizationAction.getAuthorizationLog(appId, 1).then((officers) => {
                leaveObj = {
                    data,
                    officers
                };
                return res.status(200).json(leaveObj);
            });
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching leaves ${err.message}`)
    }
});

/* Get Employee Leave application */
router.get('/get-employee-leave/:emp_id', auth(), async function (req, res, next) {
    try {

        let empId = req.params['emp_id'];
        let leaveObj = {};
        let appId = [];
        await employees.getEmployee(empId).then((data) => {
            if (_.isEmpty(data)) {
                return res.status(404).json(`Employee Doesn't Exist`)
            } else {
                leaveApplication.findEmployeeLeaveApplication(empId).then((data) => {
                    data.map((app) => {
                        appId.push(app.leapp_id);
                    });
                    authorizationAction.getAuthorizationLog(appId, 1).then((officers) => {
                        leaveObj = {
                            data,
                            officers
                        }
                        return res.status(200).json(leaveObj);
                    });

                })
            }
        })

    } catch (err) {
        return res.status(400).json(`Error while fetching leaves ${err.message}`)
    }
});

router.get('/:id', auth(), async (req, res) => { //get leave application details
    const id = parseInt(req.params.id);
    try {
        const application = await leaveApplication.getLeaveApplicationsById(id);
        const log = await authorizationAction.getAuthorizationLog(application.leapp_id, 1);
        const previousApplications = await leaveAppModel.getPreviousApplications(application.leapp_empid, id);
        return res.status(200).json({application, log, previousApplications});
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again." + e.message);
    }
});

router.get('/authorization/supervisor/:id', auth(), async (req, res) => {
    try {
        const supervisorId = req.params.id;
        let leaveObj = {};
        let ids = [];
        let authId = [];
        const authAction = await authorizationAction.getAuthorizationByOfficerId(supervisorId, 1).then((data) => {
            return data
        })
        authAction.map((app) => {
            ids.push(parseInt(app.auth_travelapp_id));
            authId.push(parseInt(app.auth_officer_id));
        });
        let data = await leaveApplication.getLeaveApplicationsForAuthorization(ids).then((apps) => {
            return apps

        });
        const officers = await authorizationAction.getAuthorizationLog(ids, 1).then((off) => {
            return off
        });

        leaveObj = {
            data,
            officers
        }

        return res.status(200).json(leaveObj)
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});

router.patch('/update-leaveapp-status/:leaveId', auth(), async (req, res)=>{
  try{
    const schema = Joi.object({
      leave: Joi.number().required(),
      status: Joi.number().required(),
    })

    const statusRequest = req.body
    const validationResult = schema.validate(statusRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }

    const leaveId = req.params.leaveId;
    const leave = await leaveAppModel.getLeaveApplicationById(parseInt(leaveId));
    if(_.isNull(leave) || _.isEmpty(leave)){
      return res.status(400).json("Leave application does not exist.");
    }
    const status = await leaveAppModel.updateLeaveAppStatus(parseInt(leaveId), req.body.status);
    if(_.isNull(status) || _.isEmpty(status)){
      return res.status(400).json("Could not update record. Try again.");
    }
    return res.status(200).json("Leave status updated.");
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }
});
router.patch('/update-leaveapp-period/:leaveId', auth(), async (req, res)=>{
  try{
    const schema = Joi.object({
      //leave: Joi.number().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),
    })

    const statusRequest = req.body
    const validationResult = schema.validate(statusRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }

    let startDate = new Date(statusRequest.start_date);
    let startYear = startDate.getFullYear();
    //let date = new Date(statusRequest.start_date)
    //let day = startDate.getDay();
    //return res.status(200).json(day);

    let endDate = new Date(statusRequest.end_date);
    let endYear = endDate.getFullYear();

    // if (isBefore(startDate, new Date())) {
    //   return res.status(400).json('Leave start date cannot be before today or today')
    // }
    //
    // if (String(startYear) !== String(endYear)) {
    //   return res.status(400).json('Leave period must be within the same year')
    // }

    let daysRequested
    if(startDate.getDay() === 6 || startDate.getDay() === 0){
      daysRequested = await differenceInBusinessDays(endDate, startDate) + 2;
    }else{
      daysRequested = await differenceInBusinessDays(endDate, startDate) + 1;
    }


    //return res.status(200).json(daysRequested)
    const empId = req.user.username.user_id;
    if (parseInt(daysRequested) <= 0) {
      return res.status(400).json('Leave duration must be greater or equal to 1')
    }


    const leaveId = req.params.leaveId;
    const leave = await leaveAppModel.getLeaveApplicationById(parseInt(leaveId)).then((data)=>{
        return data
    });
    if(_.isNull(leave) || _.isEmpty(leave)){
      return res.status(400).json("Leave application does not exist.");
    }
    const status = await leaveAppModel.updateLeaveAppPeriod(parseInt(leaveId), req.body.start_date, req.body.end_date, daysRequested);
    if(_.isNull(status) || _.isEmpty(status)){
      return res.status(400).json("Could not update record. Try again.");
    }

    const removeAccruals = await leaveAccrualService.removeLeaveAccrualByLeaveApplication(parseInt(leaveId)).then((data)=>{
        return data
    })

      let leaveDate = new Date(leave.leapp_start_date)

      const leaveAccrual = {
          lea_emp_id: leave.leapp_empid,
          lea_month: leaveDate.getFullYear(),
          lea_year: leaveDate.getMonth() + 1,
          lea_leave_type: leave.leapp_leave_type,
          lea_rate: 0 - parseFloat(leave.leapp_total_days)
      }
      const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
          return data
      })
    return res.status(200).json("Leave period updated");
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
  }
});
module.exports = router;
