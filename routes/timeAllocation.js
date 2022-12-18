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
const {sequelize, Sequelize} = require("../services/db");
const employees = require("../services/employeeService");
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const timeAllocationModel = require('../models/timeallocation')(sequelize, Sequelize.DataTypes);
const authorizationModel = require('../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);
const locationModel = require('../models/Location')(sequelize, Sequelize.DataTypes);
const salaryMappingDetailsService = require("../services/salaryMappingDetailService");
const salaryMappingMasterService = require("../services/salaryMappingMasterService");
const mailer = require("../services/IRCMailer");
const leaveApplication = require("../services/leaveApplicationService");

router.get('/', auth(), async function (req, res, next) {
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
router.post('/add-time-allocation', auth(), async function (req, res, next) {
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

      if(!employeeData.emp_supervisor_id){
        return res.status(400).json("Employee currently has no supervisor");
      }
      const empTimesheet = await timeSheet.findTimeSheetMonthEmployee(parseInt(req.body.ta_emp_id), parseInt(req.body.ta_month), parseInt(req.body.ta_year));
      if(_.isNull(empTimesheet) || _.isEmpty(empTimesheet)){
        return res.status(400).json("No timesheet submitted.")
      }
     /* const timeAllocate = await timeAllocation.findOneTimeAllocationDetail(req.body.ta_month, req.body.ta_year, req.body.ta_emp_id);
      if(_.isNull(timeAllocate) || _.isEmpty(timeAllocate)){
        return res.status(400).json('No record found.')
      }*/

        /*supervisorAssignmentService.getEmployeeSupervisor(req.body.ta_emp_id).then((sup) => {
            if (sup) {*/
                await timeAllocation.addTimeAllocation(timeAllocationRequest).then(async(data) => {
                  //return res.status(200).json(data.ta_ref_no);
                  const recordExist = await authorizationAction.getOneAuthorizationByRefNo(data.ta_ref_no);
                    if(_.isNull(recordExist) || _.isEmpty(recordExist)){
                      await authorizationAction.registerTimeAllocationAction(2,
                        data.ta_ref_no, employeeData.emp_supervisor_id, 0,
                        "Time allocation/time sheet initialized.", req.body.ta_month, req.body.ta_year)
                        .then(async (val) => {

                          const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added Time Allocation",
                            "log_date": new Date()
                          }
                          const subject = "Timesheet submission";
                          const body = "Your timesheet was submitted";
                          //emp
                          const url = 'timesheets';
                          const notifyEmployee = await handleInAppEmailNotifications(employeeData.emp_first_name, subject,body, url, employeeData.emp_office_email, employeeData.emp_id);
                          const supervisor = await employee.getEmployee(employeeData.emp_supervisor_id).then(res=>{
                            return res;
                          })
                          if(!(_.isNull(supervisor)) || !(_.isEmpty(supervisor))){
                            const notifySupervisor = await handleInAppEmailNotifications(supervisor.emp_first_name, "There's a new timesheet for you to assess","There's a new timesheet for you to assess", url, supervisor.emp_office_email, supervisor.emp_id);
                          }

                          logs.addLog(logData).then((logRes) => {
                            return res.status(200).json('Action Successful')
                          })
                        })
                    }

                })
           /* } else {
                return res.status(400).json("You currently have no supervisor assigned to you.");
            }
        });*/

    } catch (err) {
        return res.status(400).json(`Error while adding time sheet `);
        next(err);
    }
});


router.post('/update-time-allocation', auth(), async function (req, res, next) {
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
            //ta_id: Joi.number().required(),
        })
        const schemas = Joi.array().items(schema)
        const timeAllocationRequest = req.body
        const validationResult = schemas.validate(timeAllocationRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
      const employeeData = await employee.getEmployee(req.body[0].ta_emp_id).then((data) => {
        return data
      })

      if(_.isNull(employeeData) || _.isEmpty(employeeData)){
        return res.status(400).json("Employee does not exist.");
      }
        if(!employeeData.emp_supervisor_id){
          return res.status(400).json("Employee currently has no supervisor");
        }
        const timeAllocate = await timeAllocation.findTimeAllocationDetail(req.body[0].ta_month, req.body[0].ta_year, req.body[0].ta_emp_id);
        const timeAllocateCounter = timeAllocate.length;
        //return res.status(400).json(timeAlloCounter)
        const timeAllocationIds = [];
        if(!(_.isNull(timeAllocate)) || !(_.isEmpty(timeAllocate))){
          let n = 0;
          for(n = 0; n<timeAllocateCounter; n++){
            timeAllocationIds.push(timeAllocate[n].ta_id);

          }
          //delete
          await timeAllocation.deleteTimeAllocationByIds(timeAllocationIds);
        }
        //const updateTa = await timeAllocation.updateTimeAllocationByTaId(req.body.ta_id, timeAllocationRequest);

        const taCounter = req.body.length;
        let i = 0;
        for(i = 0; i<taCounter; i++){
          await timeAllocation.addTimeAllocation(timeAllocationRequest[i]);
        }
      const timeAllocate2 = await timeAllocation.findOneTimeAllocationDetail(req.body[0].ta_month, req.body[0].ta_year, req.body[0].ta_emp_id);
        if(timeAllocate2){
          /*const auth = await authorizationAction.registerNewAction(2, timeAllocate2.ta_ref_no, employeeData.emp_supervisor_id, 0, "Time allocation/time sheet initialized.")
            .then((val) => {
              const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Added Time Allocation",
                "log_date": new Date()
              }
              logs.addLog(logData).then((logRes) => {
                //return res.status(200).json('Action Successful')
              })
            });*/
            const logData = {
              "log_user_id": req.user.username.user_id,
              "log_description": "Added Time Allocation",
              "log_date": new Date()
            }
            logs.addLog(logData).then((logRes) => {
              //return res.status(200).json('Action Successful')
            })
          return res.status(200).json('Action Successful')
        }else{
          return res.status(400).json("Something went wrong. Try again.")
        }

       /* const supervise = await supervisorAssignmentService.getEmployeeSupervisor(req.body.ta_emp_id).then((sup) => {
            return sup;
        });
        if (supervise) {*/
            /*const destroyTimeAllo = await timeAllocation.deleteTimeAllocation(timeAllocationRequest).then((deldata) => {
                return deldata;
            });

            const timeall = await timeAllocation.addTimeAllocation(timeAllocationRequest).then((data) => {
                return data;
            });
            const auth = await authorizationAction.registerNewAction(2, timeall.ta_ref_no, employeeData.emp_supervisor_id, 0, "Time allocation/time sheet initialized.")
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
            return res.status(200).json('Action Successful')*/
        /*} else {
            return res.status(400).json("You currently have no supervisor assigned to you.");
        }*/

    } catch (err) {
        return res.status(400).json(`Error while adding time sheet `+err.message);

    }
});


router.get('/get-time-allocation/:emp_id/:date', auth(), async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        let date = new Date(req.params.date)
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const timeAllocationSum = await timeAllocation.sumTimeAllocation(empId, month, year).then((data) => {
            return data
        })
      const timeAllocationStatus = await timeAllocation.timeAllocationStatus(empId, month, year).then((data) => {
            return data
        })

        const timeAllocationBreakDown = await timeAllocation.findTimeAllocationsDetail(empId, month, year).then((data) => {
            return data
        })
        const responseData = {
          timeAllocationSum: timeAllocationSum,
          timeAllocationBreakDown: timeAllocationBreakDown,
          timeAllocationStatus
        }

        return res.status(200).json(responseData)
    } catch (err) {
        return res.status(400).json(`Error while fetching time allocation `);
        next(err);
    }
});

router.get('/view-time-allocation/:ref_no', auth(), async function (req, res, next) {
  try {
    let refNo = req.params.ref_no

    const timeAllocationData = await timeAllocation.findTimeAllocationsByRefNo(refNo).then((data) => {
      return data
    })

    return res.status(200).json(timeAllocationData)
  } catch (err) {
    return res.status(400).json(`Error while fetching time allocation ${err.message}`);
    next(err);
  }
})


router.get('/get-employee-time-allocation/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const timeAllocationBreakDown = await timeAllocation.findTimeAllocationsEmployee(empId).then((data) => {
            return data
        })

        return res.status(200).json(timeAllocationBreakDown)
    } catch (err) {
        return res.status(400).json(`Error while fetching time allocation `+err.message);
        next(err);
    }
});

router.get('/authorization/:super_id', auth(), async function (req, res, next) {
    try {

        let super_id = req.params.super_id
        let ref_no = [];
        let timeObj = {};

        await authorizationAction.getAuthorizationByTypeOfficerId(2,super_id).then((data) => {
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
        return res.status(400).json(`Error while fetching time allocation `);
        next(err);
    }
});


router.get('/get-timesheet-submission/:status', auth(), async function(req, res){
  try{
    const status = req.params.status;
    const allocations = await timeAllocationModel.getTimesheetSubmissionByStatus(parseInt(status));
    return res.status(200).json(allocations);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.")
  }
});

router.patch('/re-assign-timesheet/:ref_no', auth(), async function(req, res){
  try{
    const schema = Joi.object({
      reassignTo: Joi.number().required(),
      assignedTo: Joi.number().allow(null, ''),
      ref_no: Joi.string().allow(null, ''),

    })

    const timesheetReAssignmentRequest = req.body
    const validationResult = schema.validate(timesheetReAssignmentRequest, {abortEarly: false});
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    if(parseInt(req.body.assignedTo) === parseInt(req.body.reassignTo)){
      return res.status(400).json("You cannot re-assign to the same person.");
    }

    /*const assignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.assignedTo));
    if(!assignedOfficer){
      return res.status(400).json("The assigned officer does not exist.")
    }*/
    const reAssignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.reassignTo));
    if(!reAssignedOfficer){
      return res.status(400).json("The re-assign officer does not exist.")
    }
    const ref_no = req.params.ref_no;

    const timesheet = await timeAllocationModel.getOneTimesheetSubmissionByRefNo(ref_no);
    if(!timesheet){
      return res.status(400).json("There's no record for this timesheet submission.");
    }
    //return res.status(200).json(timesheet)
    const employeeData = await employees.getEmployeeByIdOnly(parseInt(timesheet.ta_emp_id));
    if(!employeeData){
      return res.status(400).json("Employee does not exist.");
    }
    /*const officerTimesheet = await authorizationModel.getAuthorizationActionByAuthTravelAppIdOfficerType(ref_no, req.body.assignedTo, 2)
    if(!officerTimesheet){
      return res.status(400).json("There's no timesheet assigned to this selected employee.");
    }*/
    const markAsReAssign = await authorizationModel.markAsReAssignedApplication(ref_no, 2);
    if(!markAsReAssign){
      return res.status(400).json("Something went wrong. Try again.");
    }

    const comment = `Timesheet re-assigned to ${reAssignedOfficer.emp_first_name} ${reAssignedOfficer.emp_last_name}`;
    const data = {
      appId:ref_no,
      officer:req.body.reassignTo,
      status:0,
      type:2,
      comment:comment,
    }
    const reAssignment = await authorizationModel.addNewAuthOfficer(data);

    //const subject = "Timesheet re-assignment";
    //const body = "Kindly attend to this leave application.";
    //const url = 'timesheets';
    //const assignedNotify = await notificationModel.registerNotification(subject, comment, assignedOfficer.emp_id, 11, url);
    //const notifySupervisor = await notificationModel.registerNotification(subject, comment, reAssignedOfficer.emp_id, 0, url);
    //const notifyEmployee = await notificationModel.registerNotification(subject, comment, timesheet.ta_emp_id, 0, url);

    //await handleInAppEmailNotifications(assignedOfficer.emp_first_name, "Time sheet re-assignment","There's a  timesheet re-assigned to you for you to assess", 'time-sheet-authorization', assignedOfficer.emp_office_email, assignedOfficer.emp_id);
    await handleInAppEmailNotifications(reAssignedOfficer.emp_first_name, "Time sheet re-assignment",`Timesheet re-assigned to ${reAssignedOfficer.emp_first_name} ${reAssignedOfficer.emp_last_name}`, 'time-sheet-authorization', reAssignedOfficer.emp_office_email, reAssignedOfficer.emp_id);
    await handleInAppEmailNotifications(employeeData.emp_first_name, "Your time sheet was re-assigned",`Your time sheet was now assigned to ${reAssignedOfficer.emp_first_name} ${reAssignedOfficer.emp_last_name}`, 'timesheets', employeeData.emp_office_email, employeeData.emp_id);

    return res.status(200).json("Timesheet re-assigned successfully.");
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again."+e.message);
  }
});

router.get('/salary-mapping-master/:month/:year/:locationId', auth(), async function (req, res, next) {
  try {
    let { month, year, locationId } = req.params;
    month = parseInt(month);
    year = parseInt(year);
    locationId = parseInt(locationId);

    const salaryMappingMasterData = await salaryMappingMasterService.getSalaryMappingMasterByMonthYearLocation(month, year, locationId).then(data => {
      return data;
    })

    return res.status(200).json(salaryMappingMasterData);

  } catch (e) {
    return res.status(400).json(`An error occurred ${e.message}`)
  }
});

router.get('/salary-mapping-details/:masterId/:t7', auth(), async function (req, res, next){
  try {
    const { masterId, t7 } = req.params;
    
    const salaryMappingDetailsData = await salaryMappingDetailsService.getSalaryMappingDetailsByMasterEmployee(masterId, t7).then(data => {
      return data;
    })

    return res.status(200).json(salaryMappingDetailsData)

  } catch (e) {
    return res.status(400).json(`An error occurred ${e.message}`)
  }
})

router.get('/restate-timesheet-application/:refNo/:status/:empId', auth(), async function(req, res){
  try{
    const refNo = req.params.refNo;
    const status = parseInt(req.params.status);
    const empId = parseInt(req.params.empId);
    const timeAlloc = await  timeAllocationModel.getOneTimesheetSubmissionByRefNo(refNo);
    if(_.isEmpty(timeAlloc) || _.isNull(timeAlloc)){
      return res.status(400).json("Whoops! Record not found.");
    }
    const empData = await employees.getEmployeeByIdOnly(empId);
    if(_.isEmpty(empData) || _.isNull(empData)){
      return res.status(400).json("Employee record not found.");
    }
    const updateLeaveApp = await timeAllocationModel.updateTimesheetStatus(refNo, status);
    const authorizationResponse = authorizationAction.registerNewAction(2, refNo, empId, 0, "Time sheet re-stated").then((data) => {
      return data
    });

    await handleInAppEmailNotifications(empData.emp_first_name, 'Time sheet re-stated','Time sheet restated', 'timesheets', empData.emp_office_email, empData.emp_id)

    return res.status(200).json('Time sheet re-stated!');
  }catch (e) {
    return res.status(400).json('Whoops!');
  }
});

router.post('/timesheet-application-tracking-report', auth(), async function(req, res){

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
        //let fyYear = `${year}`;
        //let fyYear = `FY${year}`;
        const location = req.body.location;
        let employees = [];
        const empIds = [];
        if(location === 0){
          employees = await employee.getEmployees();
        }else{
          employees = await employee.getAllEmployeesByLocation(parseInt(location));
        }
        const loc = await locationModel.getLocationById(location);

        employees.map((emp)=>{
          empIds.push(emp.emp_id);
        });

      const allocations = await timeAllocationModel.getTimesheetSubmissionByMonthYearEmpds(parseInt(month), parseInt(year), empIds);
    return res.status(200).json({allocations,loc});
  }catch (e) {
    return res.status(400).json('Whoops!');
  }
});

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

//async function emp(ref_no){
  //const timesheet = await timeAllocationModel.getOneTimesheetSubmissionByRefNo(ref_no);
 /* if(!timesheet){
    return res.status(400).json("There's no record for this timesheet submission.");
  }*/
  //return res.status(200).json(timesheet)
  //const employeeData = await employees.getEmployeeByIdOnly(parseInt(timesheet.ta_emp_id));
  //console.log(timesheet.ta_emp_id)
//}
module.exports = router;
