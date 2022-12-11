const {sequelize, Sequelize} = require('../services/db');
const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {format} = require('date-fns');
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const differenceInMonths = require('date-fns/differenceInMonths')
const isBefore = require('date-fns/isBefore')
const leaveApplication = require('../services/leaveApplicationService')
const {addLeaveAccrual, computeLeaveAccruals} = require("../routes/leaveAccrual");
const leaveAccrualService = require("../services/leaveAccrualService");
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const leaveTypeService = require('../services/leaveTypeService');
const mailer = require('../services/IRCMailer')
const hrFocalPointModel = require("../models/hrfocalpoint")(sequelize, Sequelize.DataTypes);
const leaveAppModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const publicHolidayModel = require("../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')
const employees = require("../services/employeeService");
const timeSheetService = require("../services/timeSheetService");
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const authorizationModel = require('../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const leaveAccrualModel = require("../models/leaveaccrual")(sequelize, Sequelize.DataTypes);
const {businessDaysDifference} = require("../services/dateService");
const isWeekend = require("date-fns/isWeekend");
const reader = require("xlsx");
const employee = require("../services/employeeService");


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
            leapp_alt_phone: Joi.string(),
            leaveDuration: Joi.number().allow('', null),
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
      if(parseInt(req.body.leapp_leave_type) !== 2){
        if (isBefore(startDate, new Date())) {
          return res.status(400).json('Leave start date cannot be before today or today')
        }
      }


        // if (String(startYear) !== String(endYear)) {
        //     return res.status(400).json('Leave period must be within the same year')
        // }


        let daysRequested = leaveApplicationRequest.leaveDuration;
       /* daysRequested =  differenceInBusinessDays(endDate, startDate) + 1; //differenceInBusinessDays starts counting from the next day
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const empId = req.user.username.user_id;
        let n = 0;
        const holidays = [];
        const yearPublicHolidays = await publicHolidayModel.getThisYearsPublicHolidays();
        if(!(_.isEmpty(yearPublicHolidays)) || !(_.isNull(yearPublicHolidays) ) ) {
          yearPublicHolidays.map((hols) => {
            holidays.push(`${hols.ph_year}-${hols.ph_month}-${hols.ph_day}`);
          })
          for (n = 0; n < diffDays; n++) {
            let setDate = `${startDate.getUTCFullYear()}-${startDate.getUTCMonth() + 1}-${(startDate.getUTCDate() + n)}`
            if(holidays.includes(setDate)){
              daysRequested = daysRequested - 1;
            }
          }
        }*/
        if (parseInt(daysRequested) <= 0) {
            return res.status(400).json('Leave duration must be greater or equal to 1')
        }

      //return res.status(200).json(daysRequested);
      //return res.status(200).json(holidays);
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

            if(parseInt(req.body.leapp_leave_type) !== 1 &&  parseInt(req.body.leapp_leave_type) !== 2){ //leapp_leave_type
                if (_.isNull(accruedDays) || accruedDays === 0) {
                  return res.status(400).json('No Leave Accrued for Selected Leave')
                }


                if (parseInt(daysRequested) > parseInt(accruedDays)) {
                  return res.status(400).json("Days Requested Greater than Accrued Days")
                }
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
          const templateParams = {
            firstName: `${hrp.focal_person.emp_first_name}`,
            title: `New Leave Application - Authorization Request`,
          };
          //emp
          const authorizationResponse = authorizationAction.registerNewAction(1, leaveAppId, hrp.hfp_emp_id, 0, "Leave application initiated").then((data) => {
            return data
          });
          const url = "leave-authorization";
          const notifySupervisor = await notificationModel.registerNotification(subject, body, hrp.hfp_emp_id, 0, url);
          const mailerRes =  await mailer.sendAnnouncementNotification('noreply@ircng.org', hrp.focal_person.emp_office_email, subject, templateParams).then((data)=>{
            return data
          })
        })
      const sub = "New leave application";
      const content = "Your new leave application was submitted successfully.";
      const url = "leave-application";
      const notifyEmployee = await notificationModel.registerNotification(sub, content, req.body.leapp_empid, 0, url);
      //send mail
      const subject = 'Leave application';
      //const body = "Your leave application was received. ";
      const templateParams = {
        firstName: `${emp.emp_first_name}`,
        title: `New Leave Application`,
      };
      const mailerRes =  await mailer.sendAnnouncementNotification('noreply@ircng.org', emp.emp_office_email, subject, templateParams).then((data)=>{
        return data
      })


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
            data.map(async (app) => {
              appId.push(app.leapp_id);
             /* if (new Date(app.leapp_end_date).getTime() > new Date() && app.leapp_status == 3) {
              } else {
                await leaveAppModel.updateLeaveAppStatus(app.leapp_id, 4);
              }*/
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
                    data.map(async (app) => {
                      appId.push(app.leapp_id);
                    /* if (new Date() > new Date(app.leapp_end_date).getTime()  && app.leapp_status == 3) {
                       await leaveAppModel.updateLeaveAppStatus(app.leapp_id, 4);
                      }*/
                    });
                    authorizationAction.getAuthorizationLog(appId, 1).then((officers) => {
                      let office = "";
                      officers.map((off)=>{
                        office += `${off.officers.emp_first_name} (${off.officers.emp_unique_id}), `;
                      })
                        leaveObj = {
                            data,
                            office,
                          officers
                        }
                        return res.status(200).json(leaveObj);
                    });

                })
            }
        })

    } catch (err) {
        return res.status(400).json(`Error while fetching leaves`)
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
        return res.status(400).json("Something went wrong. Try again.");
    }
});

router.get('/authorization/supervisor/:id', auth(), async (req, res) => {
    try {
        const supervisorId = req.params.id;
        let leaveObj = {};
        let ids = [];
        let authId = [];
        const authAction =
          await authorizationAction.getAuthorizationByTypeOfficerId(1,supervisorId).then((data) => {
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
        const currentDesk = [];
        officers.map((officer)=>{
          if(officer.auth_status === 0){
            let details = {
              emp_first_name: officer.officers?.emp_first_name,
              emp_last_name: officer.officers?.emp_last_name,
              emp_other_name: officer.officers?.emp_other_name,
              emp_phone_no: officer.officers?.emp_phone_no,
              emp_unique_id: officer.officers?.emp_unique_id,
              auth_travelapp_id: officer?.auth_travelapp_id,
              auth_status: officer?.auth_status
            }
            currentDesk.push(details);
          }
        })
      //return res.status(200).json(currentDesk)
        leaveObj = {
            data,
            officers,
          currentDesk
        }
        //mark notifications as read
      const notif = await notificationModel.markAsRead(parseInt(supervisorId),'leave-authorization');

        return res.status(200).json(leaveObj)
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again."+e.message);
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
    let leave = await leaveAppModel.getLeaveApplicationById(parseInt(leaveId)).then((data)=>{
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

       leave = await leaveAppModel.getLeaveApplicationById(parseInt(leaveId)).then((data)=>{
          return data
      });

      let leaveDate = new Date(leave.leapp_start_date)
    const currentDate = new Date();
    const calendarYear = currentDate.getMonth()+1 >= 1 || currentDate.getMonth()+1 <= 9 ? `FY${currentDate.getFullYear()}` : `FY${currentDate.getFullYear()+1}`;
      const leaveAccrual = {
          lea_emp_id: leave.leapp_empid,
          lea_month: leaveDate.getFullYear(),
          lea_year: leaveDate.getMonth() + 1,
          lea_leave_type: leave.leapp_leave_type,
          lea_rate: 0 - parseFloat(leave.leapp_total_days),
          lea_archives: 0,
          lea_expires_on: '1900-01-01',
          lea_fy: calendarYear,
      }
      const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
          return data
      })
    return res.status(200).json("Leave period updated");
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }
});

router.get('/get-leave-applications/:status', auth(), async function(req, res){
  try{
    const status = req.params.status;
    const leaves = await leaveAppModel.getLeaveApplicationsByStatus(parseInt(status));
    /*leaves.map(async (app) => {
      if (new Date() > new Date(app.leapp_end_date).getTime()  && app.leapp_status == 3) {
        await leaveAppModel.updateLeaveAppStatus(app.leapp_id, 4);
      }
    })*/
    return res.status(200).json(leaves);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.")
  }
});

router.patch('/re-assign-leave/:leaveId', auth(), async function(req, res){
  try{
    const schema = Joi.object({
      reassignTo: Joi.number().required(),
      assignedTo: Joi.number().required(),
      leaveId: Joi.number().allow(null, ''),

    })
    const leaveReAssignmentRequest = req.body
    const validationResult = schema.validate(leaveReAssignmentRequest, {abortEarly: false});
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    if(parseInt(req.body.assignedTo) === parseInt(req.body.reassignTo)){
      return res.status(400).json("You cannot re-assign to the same person.");
    }
    const assignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.assignedTo));
    if(!assignedOfficer){
      return res.status(400).json("The assigned officer does not exist.")
    }
    const reAssignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.reassignTo));
    if(!reAssignedOfficer){
      return res.status(400).json("The re-assign officer does not exist.")
    }
    const leaveId = req.params.leaveId;
    const leave = await leaveAppModel.getLeaveApplicationById(leaveId);
    if(!leave){
      return res.status(400).json("There's no record for this leave application request.");
    }
    const officerLeave = await authorizationModel.getAuthorizationActionByAuthTravelAppIdOfficerType(leave.leapp_id, parseInt(req.body.assignedTo), 1)
    if(!officerLeave){
      return res.status(400).json("There's no leave assigned to this selected employee.");
    }
    const markAsReAssign = await authorizationModel.markAuthorizationRequestAsReassigned(leaveId, parseInt(req.body.assignedTo), 1, 3);
    if(!markAsReAssign){
      return res.status(400).json("Something went wrong. Try again.");
    }
    const comment = `Leave application that was initially assigned to ${assignedOfficer.emp_first_name} ${assignedOfficer.emp_last_name} is now assigned to ${reAssignedOfficer.emp_first_name} ${reAssignedOfficer.emp_last_name}`;
      const data = {
        appId:leaveId,
        officer:req.body.reassignTo,
        status:0,
        type:1,
        comment:comment,
      }
    const reAssignment = await authorizationModel.addNewAuthOfficer(data);

    const subject = "Leave application re-assignment";
    const body = "Leave application re-assignment";
    const url = 'leave-authorization';
    //const assignedNotify = await notificationModel.registerNotification(subject, comment, assignedOfficer.emp_id, 11, 'leave-authorization');
    //const notifySupervisor = await notificationModel.registerNotification(subject, comment, reAssignedOfficer.emp_id, 0, 'leave-authorization');

    const notifyEmployee = await notificationModel.registerNotification(subject, comment, leave.leapp_empid, 0, 'leave-application');
    const assignedNotify = await handleInAppEmailNotifications(assignedOfficer.emp_first_name, subject,body, url, assignedOfficer.emp_office_email, assignedOfficer.emp_id)
    const notifySupervisor = await handleInAppEmailNotifications(reAssignedOfficer.emp_first_name, subject,body, url, reAssignedOfficer.emp_office_email, reAssignedOfficer.emp_id)

    //const notifyEmployee = await handleInAppEmailNotifications(reAssignedOfficer.emp_first_name, subject,body, url, reAssignedOfficer.emp_office_email, leave.leapp_empid)
    return res.status(200).json("Leave application re-assigned successfully.");
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again.");
  }
});

router.get('/schedule/cron', auth(), async function(req, res){
  try{
    const result = await  leaveApplication.getApprovedLeaves();
    result.map(async (re) => {
      if ((new Date() >= new Date(re.leapp_start_date).getTime()) && (re.leapp_status === 1) && (new Date() < new Date(re.leapp_end_date).getTime())) {
        await leaveAppModel.updateLeaveAppStatus(re.leapp_id, 3);
      }

    })
    return res.status(200).json('Good');
  }catch (e) {
    return res.status(400).json('Whoops!');
  }
});


router.get('/restate-leave-application/:leaveId/:status/:empId', auth(), async function(req, res){
  try{
    const leaveId = parseInt(req.params.leaveId);
    const status = parseInt(req.params.status);
    const empId = parseInt(req.params.empId);
    const leaveApp = await  leaveApplication.getLeaveApplicationsById(leaveId);
    if(_.isEmpty(leaveApp) || _.isNull(leaveApp)){
      return res.status(400).json("Whoops! Record not found.");
    }
    const empData = await employees.getEmployeeByIdOnly(empId);
    if(_.isEmpty(empData) || _.isNull(empData)){
      return res.status(400).json("Employee record not found.");
    }
    const updateLeaveApp = await leaveApplication.updateLeaveAppStatus(leaveId, status);
    const accrual = await leaveAccrualModel.destroyLeaveAccrualByRateEmpIdLeaveId((0 - leaveApp.leapp_total_days), leaveApp.leapp_empid, leaveId)
    const authorizationResponse = authorizationAction.registerNewAction(1, leaveId, empId, 0, "Leave application re-stated").then((data) => {
      return data
    });

    await handleInAppEmailNotifications(empData.emp_first_name, 'Leave application re-stated','Leave application restated', 'leave-authorizations', empData.emp_office_email, empData.emp_id)

    return res.status(200).json('Leave application re-stated!');
  }catch (e) {
    return res.status(400).json('Whoops!');
  }
});

router.post('/leave-application-tracking-report', auth(), async function(req, res){

    try{
        const schema = Joi.object({
            location: Joi.number().default(0).required(),
            month: Joi.number().required(),
            year: Joi.number().required(),

        })

        const validationResult = schema.validate(req.body, {abortEarly: false});

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const month = req.body.month;
        const year = req.body.year;
        let fyYear = `FY${year}`;
        const location = req.body.location;

        if(month > 9){
           fyYear = `FY${year + 1}`;
        }

        let lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0)
        const lastDayOfMonthDD = String(lastDayOfMonth.getDate()).padStart(2, '0');
        const lastDayOfMonthMM = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'); //January is 0!
        const lastDayOfMonthYYYY = lastDayOfMonth.getFullYear();

        const formatLastDayOfMonth = lastDayOfMonthDD + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthYYYY;

        let employees = [];

        if(location === 0){
            employees = await employee.getEmployees();
        }else{
            employees = await employee.getAllEmployeesByLocation(location);
        }

        const responseArray = [];

        for(emp of employees){
            const contractHireDate = new Date(emp.emp_contract_hire_date);
            const formatLastDayOfMonthDate = new Date(formatLastDayOfMonth);
            const monthDiff = await differenceInMonths(formatLastDayOfMonthDate, contractHireDate);

            let typeOfHire = null;

            if(monthDiff <= 6){
                typeOfHire = 'Short term';
            }

            if(monthDiff > 6 && monthDiff < 36){
                typeOfHire = 'Limited';
            }

            if(monthDiff >= 36){
                typeOfHire = 'Regular';
            }

            const annualLeaveDetails = await leaveTypeService.getLeaveTypeByName('Annual Leave');


            const sickLeaveDetails = await leaveTypeService.getLeaveTypeByName('Sick Leave');

            const annualLeaveAccrued = await leaveAccrualService.sumPositiveLeaveAccrualByYearMonthEmployeeLeaveType(fyYear, month, emp.emp_id, annualLeaveDetails.leave_type_id);

            const annualLeaveUsed = await leaveAccrualService.sumNegativeLeaveAccrualByYearMonthEmployeeLeaveType(fyYear, month, emp.emp_id, annualLeaveDetails.leave_type_id);

            const annualLeaveBalance = annualLeaveAccrued - annualLeaveUsed;

            const sickLeaveAccrued = await leaveAccrualService.sumPositiveLeaveAccrualByYearMonthEmployeeLeaveType(fyYear, month, emp.emp_id, sickLeaveDetails.leave_type_id);

            const sickLeaveUsed = await leaveAccrualService.sumNegativeLeaveAccrualByYearMonthEmployeeLeaveType(fyYear, month, emp.emp_id, sickLeaveDetails.leave_type_id);

            const sickLeaveBalance = sickLeaveAccrued - sickLeaveUsed;

            responseArray.push({
                d7: emp.emp_d7,
                t7: emp.emp_unique_id,
                jobTitle: emp.jobrole.job_role,
                t3: emp.sector.d_t3_code,
                t6: emp.location.l_t6_code,
                contractType: typeOfHire,
                contractHireDate: contractHireDate,
                annualLeaveRate: annualLeaveDetails.lt_rate,
                sickLeaveRate: sickLeaveDetails.lt_rate,
                annualLeaveAccrued: annualLeaveAccrued,
                annualLeaveUsed: annualLeaveUsed,
                annualLeaveBalance: annualLeaveBalance,
                percentageAnnualLeaveUsed: (annualLeaveUsed / annualLeaveAccrued) * 100,
                sickLeaveAccrued: sickLeaveAccrued,
                sickLeaveUsed: sickLeaveUsed,
                sickLeaveBalance: sickLeaveBalance,
                percentageSickLeaveUsed: (sickLeaveUsed / sickLeaveAccrued) * 100,

            })


        }

        return res.status(200).json(responseArray);

    }catch (e) {
        return res.status(400).json(e.message);
    }

})

async function handleInAppEmailNotifications(firstName, title,body, url, email, empId) {
  try {
    const templateParams = {
      firstName: firstName,
      title: title,
    }
    const mailerRes = await mailer.sendAnnouncementNotification('noreply@ircng.org', email, title, templateParams).then((data) => {
      return data
    })
    const notifyOfficer = await notificationModel.registerNotification(title, body, empId, 0, url);
  } catch (e) {

  }
}


async function runLeaveSpillOver() {
  try {
    const leaveSpillOverFile = reader.readFile('../leave_spill_over_to_fy23GGG.xlsx');
//convert xlsx to JSON
    const sheets = leaveSpillOverFile.SheetNames;
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(
        leaveSpillOverFile.Sheets[leaveSpillOverFile.SheetNames[i]])
      for (const res1 of temp) {
        //console.log('Date:: '+ExcelDateToJSDate(res1.StartDate));
        const emp = await employeeModel.getEmployeeByUniqueId(res1.T7)
        //const hrpoints = await hrFocalPointModel.getHrFocalPointsByLocationId(emp.emp_location_id);
        let leaveType = await leaveTypeService.getLeaveTypeByName(res1.LeaveType).then(res=>{
          return res;
        });
        let leaveTypeId;
        if(res1.LeaveType === 'R&R'){
          leaveTypeId = 7;
        }else{
          leaveTypeId = leaveType.leave_type_id;
        }

        const accrualData = {
          lea_emp_id: emp.emp_id,
          lea_month: 10,
          lea_year: 2022,
          lea_leave_type: leaveTypeId || 1,
          lea_rate: res1.NumberOfDays,
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: '1990-01-01',
          lea_fy: 'FY23',
          leave_narration:'Leave legacy'
        };
        const accrualLeave = await leaveAccrualService.addLeaveAccrual(accrualData);
        //Submit leave application
        //console.log(`Date Full: ${res1.StartDate}`);
        const leaveAppData = {
          leapp_empid: emp.emp_id,
          leapp_leave_type: leaveTypeId,
          leapp_start_date: ExcelDateToJSDate(res1.StartDate), //`${new Date(res1.StartDate).getFullYear()}-${new Date(res1.StartDate).getMonth()+1}-${new Date(res1.StartDate).getDay()}`,
          leapp_end_date: ExcelDateToJSDate(res1.EndDate),//`${new Date(res1.EndDate).getFullYear()}-${new Date(res1.EndDate).getMonth()+1}-${new Date(res1.EndDate).getDay()}`,
          leapp_total_days: res1.NumberOfDays,
          leapp_year: 2022,
          leapp_alt_phone: null,
          leapp_alt_email:null,
          leapp_status:0,
        }
        const leaveApplicationResponse = await leaveApplication.addLeaveApplication(leaveAppData).then((data) => {
          return data
        })
        const leaveAppId = leaveApplicationResponse.leapp_id;
        /* hrpoints.map(async (hrp) => {
           const subject = "New leave application";
           const body = "Kindly attend to this leave application.";
           const templateParams = {
             firstName: `${hrp.focal_person.emp_first_name}`,
             title: `New Leave Application - Authorization Request`,
           };
           //emp
           const authorizationResponse = authorizationAction.registerNewAction(1, leaveAppId, hrp.hfp_emp_id, 0, "Leave application initiated").then((data) => {
             return data
           });
           //const url = "leave-authorization";
           //const notifySupervisor = await notificationModel.registerNotification(subject, body, hrp.hfp_emp_id, 0, url);
         });*/
        //add authorizer
        const authorizationResponse = await authorizationAction.registerNewAction(1, leaveAppId, 351, 0, "Legacy Leave application initiated").then((data) => {
          return data
        });
        //Update authorization status
        const auth = await authorizationModel.update({
          auth_status: 1,
          auth_comment: 'Legacy leaves',
          auth_role_id: 1,//role,
        }, {
          where: {
            auth_travelapp_id: leaveAppId, auth_type: 1, auth_officer_id: 351
          }
        });

        //update leave application status as approved
        await leaveAppModel.update({
          leapp_status: 1,
          leapp_approve_comment: 'Legacy leaves',
          leapp_approve_date: new Date(),
          leapp_approve_by: 351,
        }, {
          where: {
            leapp_id: leaveAppId
          }
        });

        //Push negative to accrual
        const negativeAccrualData = {
          lea_emp_id: emp.emp_id,
          lea_month: 10,
          lea_year: 2022,
          lea_leave_type: leaveTypeId || 1,
          lea_rate: 0 - res1.NumberOfDays,
          lea_archives: 0,
          lea_leaveapp_id: 0,
          lea_expires_on: '1990-01-01',
          lea_fy: 'FY23',
        };
        const negativeAccrualLeave = await leaveAccrualService.addLeaveAccrual(negativeAccrualData);
      }
    }

  } catch (e) {

  }
}
function ExcelDateToJSDate(serial) {
  let utc_days  = Math.floor(serial - 25569 + 1);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);
  let fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  let seconds = total_seconds % 60;
  total_seconds -= seconds;
  let hours = Math.floor(total_seconds / (60 * 60));
  let minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

runLeaveSpillOver();

module.exports = router;
