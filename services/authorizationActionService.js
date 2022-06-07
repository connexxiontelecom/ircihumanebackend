const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const _ = require('lodash');
const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const travelApplicationModel = require("../models/TravelApplication")(sequelize, Sequelize.DataTypes);
const leaveApplicationModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const timeSheetModel = require("../models/timesheet")(sequelize, Sequelize.DataTypes);
const timeAllocationModel = require("../models/timeallocation")(sequelize, Sequelize.DataTypes);
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const logs = require('../services/logService');
const timeSheetPenaltyService = require('../services/timesheetPenaltyService');
const timeSheetService = require('../services/timeSheetService');
const timeAllocationService = require('../services/timeAllocationService');
const employeeService = require('../services/employeeService');
const Op = Sequelize.Op;
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const leaveApplicationService = require('../services/leaveApplicationService');


const helper = require('../helper');
const differenceInBusinessDays = require("date-fns/differenceInBusinessDays");
const {addLeaveAccrual} = require("../routes/leaveAccrual");
const errHandler = (err) => {
    console.log("Error: ", err);
}

const registerNewAction = async (auth_type, travel_app, officer, status, comment) => {
    return await authorizationModel.create({
        auth_officer_id: officer,
        auth_status: status,
        auth_comment: comment,
        auth_type: auth_type,
        auth_travelapp_id: travel_app
    });

}

const getOneAuthorizationByRefNo = async (ref_no) => {
  return await authorizationModel.findOne({where:{auth_travelapp_id:ref_no}});
}

const updateAuthorizationStatus = async (req, res) => {

    try {
        const schema = Joi.object({
            appId: Joi.string().required(),
            status: Joi.number().required(),
            officer: Joi.number().required(),
            type: Joi.number().required(),
            comment: Joi.string().required(),
            role: Joi.number().required(),

            markAsFinal: Joi.number().required().valid(0, 1),
            nextOfficer: Joi.alternatives().conditional('markAsFinal', {is: 0, then: Joi.number().required()}),

        });

        const authRequest = req.body
        const validationResult = schema.validate(authRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }

        const {appId, role, status, officer, type, comment, markAsFinal, nextOfficer} = req.body;


        const application = await authorizationModel.findOne(
            {
                where: {auth_travelapp_id: appId, auth_type: type, auth_status: 0, auth_officer_id: officer},
            });

        if (!_.isNull(application) || !_.isEmpty(application)) {
            if (application.auth_officer_id !== officer) return res.status(400).json("You do not have permission to authorize this request.");


            const auth = await authorizationModel.update({
                auth_status: status,
                auth_comment: comment,
                auth_role_id: role,
            }, {
                where: {
                    auth_travelapp_id: appId, auth_type: type, auth_officer_id: officer
                }
            });

            if (markAsFinal === 0) {
                await authorizationModel.create({
                    auth_officer_id: nextOfficer,
                    auth_type: type,
                    auth_travelapp_id: appId
                });
              const subject = "Self-service update!";
              const body = "An event recently occurred on one of your self-service areas.";
              //emp
              const url = req.headers.referer;
              //const notify = await notificationModel.registerNotification(subject, body, employeeData.emp_id, 11, url);
              const notifyOfficer = await notificationModel.registerNotification(subject, "Your action was recorded.", officer, 0, url);
              const notifyNextOfficer = await notificationModel.registerNotification(subject, "You've been chosen to act on a task.", nextOfficer, 0, url);


              //Log
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": `Log on authorization: Authorized request.`,
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes) => {
                    res.status(200).json("Your action was registered successfully.");
                });
            } else if (markAsFinal === 1) {
                switch (type) {
                    case 1: //leave application
                        await leaveApplicationModel.update({
                            leapp_status: status,
                            leapp_approve_comment: comment,
                            leapp_approve_date: new Date(),
                            leapp_approve_by: officer,
                        }, {
                            where: {
                                leapp_id: appId
                            }
                        });

                        const leaveApplicationData = await leaveApplicationService.getLeaveApplicationWithId(appId).then((data)=>{
                            return data
                        })

                        let leaveDate = new Date(leaveApplicationData.leapp_start_date)

                        const leaveAccrual = {
                            lea_emp_id: leaveApplicationData.leapp_empid,
                            lea_month: leaveDate.getFullYear(),
                            lea_year: leaveDate.getMonth() + 1,
                            lea_leave_type: leaveApplicationData.leapp_leave_type,
                            lea_rate: 0 - parseFloat(leaveApplicationData.leapp_total_days)
                        }

                        const addAccrualResponse = await addLeaveAccrual(leaveAccrual).then((data) => {
                            return data
                        })


                        //update timesheet
                      const leaveApp = await leaveApplicationModel.getLeaveApplicationById(appId);
                      if(!(_.isNull(leaveApp)) || !(_.isEmpty(leaveApp)) ){
                        let startDate = new Date(leaveApp.leapp_start_date);
                        let endDate = new Date(leaveApp.leapp_end_date);
                        let numDays
                        if(startDate.getDay() === 6 || startDate.getDay() === 0){
                          numDays = await differenceInBusinessDays(endDate, startDate) + 2;
                        }else{
                          numDays = await differenceInBusinessDays(endDate, startDate) + 1;
                        }
                        let i = 0;
                        if(numDays > 0){
                          for(i=0; i<= numDays; i++){
                            const loopPeriod = {
                              emp_id:leaveApp.leapp_empid,
                              day:i === 0 ? startDate.getUTCDate() : (startDate.getUTCDate() + i),
                              month: startDate.getUTCMonth() + 1,
                              year: startDate.getUTCFullYear()
                            }
                            await timeSheetService.updateTimesheetByDateRange(loopPeriod);
                          }
                        }

                      }
                        break;
                    case 2: //time sheet

                        const taData = await timeAllocationModel.update({
                            ta_status: status,
                            ta_comment: comment,
                            ta_date_approved: new Date(),
                            ta_approved_by: officer,
                        }, {
                            where: {
                                ta_ref_no: appId
                            }
                        });


                        const timealloc = await timeAllocationService.findOneTimeAllocationByRefNo(appId).then((val) => {
                            return val;
                        });

                        if (_.isEmpty(timealloc) || _.isNull(timealloc)) {
                            return res.status(400).json("Whoops! Record does not exist.");

                        } else {

                            const employee = await employeeService.getEmployeeByIdOnly(timealloc.ta_emp_id).then((data) => {
                                return data;
                            });

                            const daysAbsent = await timeSheetService.getAttendanceStatus(0, timealloc.ta_emp_id, parseInt(timealloc.ta_month), parseInt(timealloc.ta_year)).then((res) => {
                                return res.length;
                            });


                            const grossSalary = employee.emp_gross;
                            let charge = (grossSalary / 22);
                            let payable = charge * parseInt(daysAbsent);

                            //return res.status(200).json(payable.toFixed(2));
                            if (payable > 0) {
                                const setData = {
                                    tsp_emp_id: timealloc.ta_emp_id,
                                    tsp_month: timealloc.ta_month,
                                    tsp_year: timealloc.ta_year,
                                    tsp_days_absent: daysAbsent,
                                    tsp_amount: payable.toFixed(2),
                                    tsp_ref_no: timealloc.ta_ref_no
                                };
                                await timeSheetPenaltyService.addTimeSheetPenalty(setData).then((n) => {

                                })
                            }
                        }

                        break;
                    case 3: //travel application
                        await travelApplicationModel.update({
                            travelapp_status: status,
                            travelapp_approve_comment: comment,
                            travelapp_date_approved: new Date(),
                            travelapp_approved_by: officer,
                        }, {
                            where: {
                                travelapp_id: appId
                            }
                        });
                        break;
                }
              const subject = "Self-service update!";
              const body = "An event recently occurred on one of your self-service areas.";
              //emp
              const url = req.headers.referer;
              //const notify = await notificationModel.registerNotification(subject, body, employeeData.emp_id, 11, url);
              const notifyOfficer = await notificationModel.registerNotification(subject, "Request finally marked as closed.", officer, 0, url);
              //const notifyNextOfficer = await notificationModel.registerNotification(subject, "You've been chosen to act on a task.", nextOfficer, 0, url);

              //Log
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": `Log on authorization: marked request as final.`,
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes) => {
                    res.status(200).json("Your action was registered successfully.");
                });
            }
        } else {
            res.status(404).json("Whoops! The requested record does not exist.");
        }

    } catch (e) {
        return res.status(400).json("Something went wrong. Try again." + e.message);
    }
}


const getAuthorizationByOfficerId = async (req, res) => {
  try{
    const { type, authId } = req.params;
    const result =  await authorizationModel.findAll({
      where: {
        auth_status:0,
        auth_type: parseInt(type),
        auth_travelapp_id: authId
      },
      include:[{model:EmployeeModel, as: 'officers'}]
    });
    return res.status(200).json(result);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again."+e.message);
  }

}

// const getAuthorizationLog = async (authId, type )=>{
//     return await authorizationModel.findAll({
//         where:{auth_travelapp_id: authId, auth_type:type},
//         //include:[EmployeeModel]
//     });
// }

async function getAuthorizationLog(authId, type) {
    return await authorizationModel.findAll({
        order:[['auth_id', 'DESC']],
        where: {auth_travelapp_id: authId, auth_type: type},
        include: ['officers', 'role']
    });
}


module.exports = {
    registerNewAction,
    updateAuthorizationStatus,
    //getTravelAuthorizationByOfficerId,
    getAuthorizationByOfficerId,
    getAuthorizationLog,
    getOneAuthorizationByRefNo

}
