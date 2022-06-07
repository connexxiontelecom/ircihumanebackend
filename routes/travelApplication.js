const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const _ = require('lodash');
const {format} = require('date-fns');
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const auth = require("../middleware/auth");
const Joi = require('joi');
const logs = require('../services/logService');

const travelApplicationService = require('../services/travelApplicationService');
const travelApplicationBreakdownService = require('../services/travelApplicationBreakdownService');
const travelApplicationT2Service = require('../services/travelApplicationT2Service');
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const sectorService = require('../services/departmentService');
const employeeService = require('../services/employeeService');
const {sequelize, Sequelize} = require("../services/db");
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const travelApplicationModel = require('../models/TravelApplication')(sequelize, Sequelize.DataTypes);
/* state routes. */

router.get('/', auth(), travelApplicationService.getTravelApplications);
router.get('/my-travel-applications', auth(), travelApplicationService.getTravelApplicationsByEmployeeId);

router.post('/new-travel-application', auth(), async (req, res) => {
    try {
        const schema = Joi.object({
            employee: Joi.number().required(),
            travel_category: Joi.number().required().valid(1, 2),
            per_diem: Joi.alternatives().conditional('travel_category', {is: 1, then: Joi.number().required()}),
            t2_code: Joi.alternatives().conditional('travel_category', {
                is: 1, then: Joi.array().items(Joi.object({
                    code: Joi.string().allow(null, '')
                }))
            }),
            /*t2_code: Joi.alternatives().conditional('travel_category', { is: 2, then: Joi.array().items(Joi.object({
                    code: Joi.number().allow('')
                }))}),*/
            hotel: Joi.number().required().valid(1, 2),
            city: Joi.alternatives().conditional('hotel', {is: 1, then: Joi.string().required()}),
            arrival_date: Joi.alternatives().conditional('hotel', {is: 1, then: Joi.string().required()}),
            departure_date: Joi.alternatives().conditional('hotel', {is: 1, then: Joi.string().required()}),
            preferred_hotel: Joi.alternatives().conditional('hotel', {is: 1, then: Joi.string().required()}),


            purpose: Joi.string().required(),
            start_date: Joi.string().required(),
            end_date: Joi.string().required(),
            t1_code: Joi.string().allow(null, ''),
            currency: Joi.string().allow(null, ''),
            total: Joi.number().allow(null, ''),

            breakdown: Joi.array().items(Joi.object({
                depart_from: Joi.string().required(),
                actual_date: Joi.string().required(),
                means: Joi.number().required(),
                prompt: Joi.number().required(),
                destination: Joi.string().required()
            })),
        });
        const travelRequest = req.body
        const validationResult = schema.validate(travelRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }

        const {start_date, end_date} = req.body;
        let startDate = new Date(start_date);
        let startYear = startDate.getFullYear();
        let endDate = new Date(end_date);
        let endYear = endDate.getFullYear();
        if (isBefore(startDate, new Date())) return res.status(400).json("Your start date cannot be before today.");
        if (isBefore(endDate, new Date())) return res.status(400).json("Your end date cannot be before today.");
        if (String(startYear) === String(endYear)) {
            //sector lead instead
            const emp = await employeeService.getEmployeeByIdOnly(req.body.employee).then((user) => {
                return user;

            })
            //return res.status(200).json(emp);
            if (_.isEmpty(emp) || _.isNull(emp)) {
                return res.status(400).json("Could not find employee record.");
            }
            const empSectorId = parseInt(emp.emp_department_id);

            const sectorLeads = await sectorService.getDepartmentSectorLeadBySectorId(empSectorId).then((sec) => {
                return sec;
            });
            if (_.isNull(sectorLeads) || _.isEmpty(sectorLeads)) {
                return res.status(400).json("Employee sector does not exist. Either set it up or contact admin.");
            }

            //supervisorAssignmentService.getEmployeeSupervisor(req.body.employee).then((sup)=>{
            //if(sup){
          const url = req.headers.referer;
            let daysRequested = differenceInBusinessDays(endDate, startDate);
            if (parseInt(daysRequested) >= 1) {
                travelApplicationService.setNewTravelApplication(travelRequest, daysRequested).then(async (data) => {
                  const travelapp_id = data.travelapp_id;
                  const breakdowns = req.body.breakdown;
                  breakdowns.map((breakdown) => {
                    travelApplicationBreakdownService.setNewTravelApplicationBreakdown(breakdown, travelapp_id);
                  });
                  if (req.body.travel_category === 1) {

                    const t2CodeArray = req.body.t2_code;
                    t2CodeArray.map((t2Data) => {
                      travelApplicationT2Service.setNewTravelApplicationT2(travelapp_id, t2Data.code)
                    });
                  }
                  sectorLeads.map((sectorLead) => {
                    authorizationAction.registerNewAction(3, travelapp_id, sectorLead.d_sector_lead_id, 0, "Travel application initialized.")
                      .then(async (outcome) => {

                        const logData = {
                          "log_user_id": req.user.username.user_id,
                          "log_description": "Travel application ",
                          "log_date": new Date()
                        }
                        const subject = "New Travel application";
                        //const body = "Your timesheet was submitted";
                        //emp

                        const notifySupervisor = await notificationModel.registerNotification(subject, "Kindly attend to this travel application.", sectorLead.d_sector_lead_id, 0, url);

                        logs.addLog(logData).then((logRes) => {
                          /*return res.status(200).json('Your travel application was successfully registered.');*/
                        })
                      });
                  });
                  const notify = await notificationModel.registerNotification("New Travel application", "Your travel application was submitted", req.body.employee, 11, url);
                  return res.status(200).json('Your travel application was successfully registered.');

                });
            } else {
                return res.status(400).json('Travel duration must be greater or equal to 1');
            }
            /*}else{
                return res.status(400).json("You currently have no supervisor assigned to you.");
            }*/
            //});
        } else {
            return res.status(400).json('Travel period must be within the same year')
        }

    } catch (e) {
        return res.status(400).json(`Something went wrong. Inspect and try again`);
    }
});

router.get('/get-travel-application/:id', auth(), async (req, res) => {
    const employee = req.params.id
    try {
        let travelObj = {};
        let appId = [];
        await travelApplicationService.getTravelApplicationsByEmployeeId(employee).then((data) => {
            data.map((app) => {
                appId.push(app.travelapp_id);
            });
            authorizationAction.getAuthorizationLog(_.uniq(appId), 3).then((officers) => {
                travelObj = {
                    data,
                    officers
                }
                return res.status(200).json(travelObj);
            });
        });
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});
router.get('/:id', auth(), async (req, res) => { //get travel application details
    const id = req.params.id
    try {
        const application = await travelApplicationService.getTravelApplicationsById(id);
        const breakdown = await travelApplicationBreakdownService.getDetailsByTravelApplicationId(id);
        const expenses = await travelApplicationT2Service.getT2DetailsByTravelApplicationId(id);
        //return res.status(200).json(application.travelapp_id);
        const log = await authorizationAction.getAuthorizationLog(application.travelapp_id, 3);
        return res.status(200).json({application, breakdown, expenses, log});
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again." + e.message);
    }
});

router.get('/authorization/supervisor/:id', auth(), async (req, res) => {
    try {
        const supervisorId = req.params.id;
        let travelObj = {};
        await authorizationAction.getAuthorizationByOfficerId(supervisorId, 3).then((data) => {
            const ids = [];
            data.map((app) => {
                ids.push(parseInt(app.auth_travelapp_id));
            });
            travelApplicationService.getTravelApplicationsForAuthorization(_.uniq(ids)).then((data) => {
                let appId = [];
                data.map((app) => {
                    appId.push(app.travelapp_id);
                });
                authorizationAction.getAuthorizationLog(appId, 3).then((officers) => {
                    travelObj = {
                        data,
                        officers
                    }
                    return res.status(200).json(travelObj);
                });

            });
        })
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again." + e.message);
    }
});


/*router.get('/authorization/supervisor/:id',auth(), async (req, res)=>{
    try{
        const employeeId = req.params.id;  //req.employee.emp_id || 1;
        await authorizationAction.getTravelAuthorizationByOfficerId(employeeId,3).then((data)=>{
            const ids = [];
            data.map((app)=>{
                ids.push(app.auth_travelapp_id);
            });
            travelApplicationService.getTravelApplicationsForAuthorization(ids).then((data)=>{
                return res.status(200).json(data);
            });
        })
    }catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});*/


/*router.post('/authorization', auth(), async (req, res)=>{
    try{
        const schema = Joi.object({
            comment:Joi.string().required(),
            status:Joi.number().required(),
            officer:Joi.number().required(),
            travelapp_id:Joi.number().required(),
            mark_as_final:Joi.number().required()
        });
        const travelRequest = req.body
        const validationResult = schema.validate(travelRequest)
        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }


    }catch (e) {

    }
});*/

router.get('/get-travel-application-status/:status', auth(), async function(req, res){
  try{
    const status = req.params.status;
    const apps = await travelApplicationModel.getTravelApplicationsByStatus(status);
    return res.status(200).json(apps);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later."+e.message)
  }
});


module.exports = router;
