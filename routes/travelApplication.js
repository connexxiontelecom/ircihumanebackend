const express = require('express');
const router = express.Router();
const { parse, stringify, toJSON, fromJSON } = require('flatted');
const _ = require('lodash');
const { format } = require('date-fns');
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays');
const isBefore = require('date-fns/isBefore');
const auth = require('../middleware/auth');
const Joi = require('joi');
const logs = require('../services/logService');

const travelApplicationService = require('../services/travelApplicationService');
const travelApplicationBreakdownService = require('../services/travelApplicationBreakdownService');
const travelApplicationT2Service = require('../services/travelApplicationT2Service');
const travelApplicationTravellerService = require('../services/travelApplicationTravellerService');
const travelApplicationHotelService = require('../services/travelApplicationHotelService');
const travelApplicationAttachmentService = require('../services/travelApplicationAttachmentService');
const departmentService = require('../services/departmentService');
const locationService = require('../services/locationService');
const countryCodeService = require('../services/countryCodeService');
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const sectorService = require('../services/departmentService');
const employeeService = require('../services/employeeService');
const { sequelize, Sequelize } = require('../services/db');
const employees = require('../services/employeeService');
const path = require('path');
const documents = require('../services/employeeDocumentsService');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: `${process.env.ACCESS_KEY}`,
  secretAccessKey: `${process.env.SECRET_KEY}`
});
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const travelApplicationModel = require('../models/TravelApplication')(sequelize, Sequelize.DataTypes);
const authorizationModel = require('../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);

/* state routes. */

router.get('/', auth(), travelApplicationService.getTravelApplications);
router.get('/my-travel-applications', auth(), travelApplicationService.getTravelApplicationsByEmployeeId);

router.post('/new-travel-application', auth(), async (req, res) => {
  try {
    const schema = Joi.object({
      employee: Joi.number().required(),
      travel_category: Joi.number().required().valid(1, 2),
      per_diem: Joi.alternatives().conditional('travel_category', { is: 1, then: Joi.number().required() }),
      currency: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.string().required().valid('NGN', 'GBP', 'USD', null),
        otherwise: Joi.string().allow(null, '')
      }),
      t2_code: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.array().items(
          Joi.object({
            code: Joi.string().allow(null, '')
          })
        )
      }),
      /*t2_code: Joi.alternatives().conditional('travel_category', { is: 2, then: Joi.array().items(Joi.object({
              code: Joi.number().allow('')
          }))}),*/
      hotel: Joi.number().required().valid(1, 2),
      // city: Joi.alternatives().conditional('hotel', { is: 1, then: Joi.string().required() }),
      // arrival_date: Joi.alternatives().conditional('hotel', { is: 1, then: Joi.string().required() }),
      // departure_date: Joi.alternatives().conditional('hotel', { is: 1, then: Joi.string().required() }),
      // preferred_hotel: Joi.alternatives().conditional('hotel', { is: 1, then: Joi.string().required() }),
      hotels: Joi.alternatives().conditional('hotel', {
        is: 1,
        then: Joi.array()
          .min(1)
          .items(
            Joi.object({
              name: Joi.string().required(),
              city: Joi.string().required(),
              country: Joi.string().required(),
              arrival_date: Joi.string().required(),
              departure_date: Joi.string().required()
            })
          )
          .messages({
            'array.min': 'At least one hotel is required!'
          })
      }),

      purpose: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),
      t1_code: Joi.string().allow(null, ''),
      total: Joi.number().allow(null, ''),

      breakdown: Joi.array().items(
        Joi.object({
          depart_from: Joi.string().required(),
          actual_date: Joi.string().required(),
          means: Joi.number().required(),
          prompt: Joi.number().required(),
          destination: Joi.string().required()
        })
      ),

      travellers: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.array()
          .min(1)
          .items(
            Joi.object({
              name: Joi.string().required(),
              phone: Joi.string().required(),
              t7: Joi.string().allow(null, '')
            })
          )
          .messages({
            'array.min': 'Official travel applications require a minimum of 1 traveller!'
          })
      }),

      d3_id: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, '')
      }),
      d4_id: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, '')
      }),
      d5_id: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, '')
      }),
      trip_type: Joi.alternatives().conditional('travel_category', {
        is: 1,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, '')
      })
    });
    const travelRequest = req.body;
    console.log(travelRequest, 'travelRequest');
    const validationResult = schema.validate(travelRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const { start_date, end_date } = req.body;
    let startDate = new Date(start_date);
    let startYear = startDate.getFullYear();
    let endDate = new Date(end_date);
    let endYear = endDate.getFullYear();
    if (isBefore(startDate, new Date())) return res.status(400).json('Your start date cannot be before today.');
    if (isBefore(endDate, new Date())) return res.status(400).json('Your end date cannot be before today.');
    if (String(startYear) === String(endYear)) {
      //sector lead instead
      const emp = await employeeService.getEmployeeByIdOnly(req.body.employee).then((user) => {
        return user;
      });
      //return res.status(200).json(emp);
      if (_.isEmpty(emp) || _.isNull(emp)) {
        return res.status(400).json('Could not find employee record.');
      }
      const empSectorId = parseInt(emp.emp_department_id);

      const sectorLeads = await sectorService.getDepartmentSectorLeadBySectorId(empSectorId).then((sec) => {
        return sec;
      });
      if (_.isNull(sectorLeads) || _.isEmpty(sectorLeads)) {
        return res.status(400).json('Employee sector does not exist. Either set it up or contact admin.');
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

          if (req.body.hotel === 1) {
            const hotels = req.body.hotels;
            hotels.map((hotel) => {
              travelApplicationHotelService.setNewTravelApplicationHotel(hotel, travelapp_id);
            });
          }

          if (req.body.travel_category === 1) {
            const t2CodeArray = req.body.t2_code;
            t2CodeArray.map((t2Data) => {
              travelApplicationT2Service.setNewTravelApplicationT2(travelapp_id, t2Data.code);
            });

            const travellers = req.body.travellers;
            travellers.map((traveller) => {
              travelApplicationTravellerService.setNewTravelApplicationTraveller(traveller, travelapp_id);
            });
          }

          // if (req.body.travel_category === 1) {

          // }

          sectorLeads.map((sectorLead) => {
            authorizationAction
              .registerNewAction(3, travelapp_id, sectorLead.d_sector_lead_id, 0, 'Travel application initialized.')
              .then(async (outcome) => {
                const logData = {
                  log_user_id: req.user.username.user_id,
                  log_description: 'Travel application ',
                  log_date: new Date()
                };
                const subject = 'New Travel application';
                //const body = "Your timesheet was submitted";
                //emp

                const notifySupervisor = await notificationModel.registerNotification(
                  subject,
                  'Kindly attend to this travel application.',
                  sectorLead.d_sector_lead_id,
                  0,
                  url
                );

                logs.addLog(logData).then((logRes) => {
                  /*return res.status(200).json('Your travel application was successfully registered.');*/
                });
              });
          });
          const notify = await notificationModel.registerNotification(
            'New Travel application',
            'Your travel application was submitted',
            req.body.employee,
            11,
            url
          );
          return res.status(200).json({ travelapp_id, message: 'Your travel application was successfully registered.' });
        });
      } else {
        return res.status(400).json('Travel duration must be greater or equal to 1');
      }
      /*}else{
          return res.status(400).json("You currently have no supervisor assigned to you.");
      }*/
      //});
    } else {
      return res.status(400).json('Travel period must be within the same year');
    }
  } catch (e) {
    return res.status(400).json(`Something went wrong. Inspect and try again`);
  }
});

router.post('/upload-attachments/:travelapp_id', auth(), async (req, res, next) => {
  const travelapp_id = req.params.travelapp_id;
  try {
    const travelApplication = await travelApplicationService.getTravelApplicationsById(travelapp_id);
    if (_.isEmpty(travelApplication)) throw `Travel application with id:${travelapp_id} not found`;

    const attachments = req.files.attachments;
    if (Array.isArray(attachments)) {
      let success = [];
      for (const attachment of attachments) {
        const uploadResponse = await uploadFile(attachment).then((response) => response);
        if (_.isEmpty(uploadResponse) || _.isNull(uploadResponse)) {
          if (!(_.isEmpty(success) || _.isNull(success))) {
            for (const failure of success) {
              let removeResponse = await travelApplicationAttachmentService.deleteTravelApplicationAttachment(failure).then((data) => {
                return data;
              });
            }
            await travelApplicationService.deleteTravelApplication(travelapp_id).catch((err) => {
              console.error(err);
            });
            throw `An error occurred while uploading attachments`;
          }
          await travelApplicationService.deleteTravelApplication(travelapp_id).catch((err) => {
            console.error(err);
          });
          throw `An error occurred while uploading attachments`;
        }

        const attachmentData = {
          doc: uploadResponse,
          filename: attachment.name
        };

        let attachmentResponse = await travelApplicationAttachmentService
          .setNewTravelApplicationAttachment(attachmentData, travelapp_id)
          .then((res) => res);

        if (_.isEmpty(attachmentResponse) || _.isNull(attachmentResponse)) {
          if (!(_.isEmpty(success) || _.isNull(success))) {
            for (const failure of success) {
              let removeResponse = await travelApplicationAttachmentService.deleteTravelApplicationAttachment(failure).then((data) => {
                return data;
              });
            }
            await travelApplicationService.deleteTravelApplication(travelapp_id).catch((err) => {
              console.error(err);
            });
            throw `An error occurred while uploading attachments`;
          }
          await travelApplicationService.deleteTravelApplication(travelapp_id).catch((err) => {
            console.error(err);
          });
          throw `An error occurred while uploading attachments`;
        }
        success.push(uploadResponse);
      }
    }
    return res.status(200).json(`Your travel application was successfully registered.`);
  } catch (error) {
    console.error(error);
    return res.status(400).json(`Something went wrong. Please contact support!`);
  }
});

router.get('/get-travel-application/:id', auth(), async (req, res) => {
  const employee = req.params.id;
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
        };
        return res.status(200).json(travelObj);
      });
    });
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
  }
});
router.get('/:id', auth(), async (req, res) => {
  //get travel application details
  const id = req.params.id;
  try {
    const application = await travelApplicationService.getTravelApplicationsById(id);
    const breakdown = await travelApplicationBreakdownService.getDetailsByTravelApplicationId(id);
    const expenses = await travelApplicationT2Service.getT2DetailsByTravelApplicationId(id);
    const sector = await departmentService.findDepartmentById(application.travelapp_d3_id);
    const location = await locationService.findLocationById(application.travelapp_d4_id);
    const countryCode = await countryCodeService.findCountryCodeById(application.travelapp_d5_id);
    const travellers = await travelApplicationTravellerService.findTravellersByTravelApplicationId(id);
    const hotels = await travelApplicationHotelService.findHotelsByTravelApplicationId(id);
    const attachments = await travelApplicationAttachmentService.findAttachmentsByTravelApplicationId(id);
    const log = await authorizationAction.getAuthorizationLog(application.travelapp_id, 3);
    return res.status(200).json({
      application,
      breakdown,
      expenses,
      sector,
      location,
      countryCode,
      travellers,
      hotels,
      attachments,
      log
    });
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
  }
});

router.get('/authorization/supervisor/:id', auth(), async (req, res) => {
  try {
    const supervisorId = req.params.id;
    let travelObj = {};

    const authOfficers = await authorizationAction.getAuthorizationByTypeOfficerId(3, supervisorId).then((data) => {
      return data;
    });
    const ids = [];
    authOfficers.map((app) => {
      ids.push(parseInt(app.auth_travelapp_id));
    });

    const travelApplicationsForAuth = await travelApplicationService.getTravelApplicationsForAuthorization(_.uniq(ids)).then((data) => {
      return data;
    });

    let appId = [];
    travelApplicationsForAuth.map((app) => {
      appId.push(app.travelapp_id);
    });

    const officers = await authorizationAction.getAuthorizationLog(appId, 3).then((data) => {
      return data;
    });

    travelObj = {
      travelApplicationsForAuth,
      officers
    };
    return res.status(200).json(travelObj);
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
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

router.get('/get-travel-application-status/:status', auth(), async function (req, res) {
  try {
    const status = req.params.status;
    const apps = await travelApplicationModel.getTravelApplicationsByStatus(status);
    return res.status(200).json(apps);
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again later.' + e.message);
  }
});

router.patch('/re-assign-travel-application/:appId', auth(), async function (req, res) {
  try {
    const schema = Joi.object({
      reassignTo: Joi.number().required(),
      assignedTo: Joi.number().required(),
      appId: Joi.number().allow(null, '')
    });
    const travelReAssignmentRequest = req.body;
    const validationResult = schema.validate(travelReAssignmentRequest, { abortEarly: false });
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    if (parseInt(req.body.assignedTo) === parseInt(req.body.reassignTo)) {
      return res.status(400).json('You cannot re-assign to the same person.');
    }
    const assignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.assignedTo));
    if (!assignedOfficer) {
      return res.status(400).json('The assigned officer does not exist.');
    }
    const reAssignedOfficer = await employees.getEmployeeByIdOnly(parseInt(req.body.reassignTo));
    if (!reAssignedOfficer) {
      return res.status(400).json('The re-assign officer does not exist.');
    }
    const travelId = req.params.appId;
    //return res.status(400).json(travelId);
    const travel = await travelApplicationModel.getTravelApplicationsById(travelId);
    if (!travel) {
      return res.status(400).json("There's no record for this travel application request.");
    }
    const officerTravel = await authorizationModel.getAuthorizationActionByAuthTravelAppIdOfficerType(travel.travelapp_id, req.body.assignedTo, 3);
    if (!officerTravel) {
      return res.status(400).json("There's no travel application assigned to this employee.");
    }
    const markAsReAssign = await authorizationModel.markAsReAssignedApplication(travelId, parseInt(req.body.assignedTo), 3);
    if (!markAsReAssign) {
      return res.status(400).json('Something went wrong. Try again.');
    }
    const comment = `Travel application that was initially assigned to ${assignedOfficer.emp_first_name} ${assignedOfficer.emp_last_name} is now assigned to ${reAssignedOfficer.emp_first_name} ${reAssignedOfficer.emp_last_name}`;
    const data = {
      appId: travelId,
      officer: req.body.reassignTo,
      status: 0,
      type: 3,
      comment: comment
    };
    const reAssignment = await authorizationModel.addNewAuthOfficer(data);

    const subject = 'Travel application re-assignment';
    //const body = "Kindly attend to this leave application.";
    const url = req.headers.referer;
    const assignedNotify = await notificationModel.registerNotification(subject, comment, assignedOfficer.emp_id, 11, url);
    const notifySupervisor = await notificationModel.registerNotification(subject, comment, reAssignedOfficer.emp_id, 0, url);
    const notifyEmployee = await notificationModel.registerNotification(subject, comment, travel.travelapp_employee_id, 0, url);

    return res.status(200).json('Travel application re-assigned successfully.');
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
  }
});

const uploadFile = (fileRequest) => {
  //const fileRequest = req.files.test
  return new Promise(async (resolve, reject) => {
    let s3Res;
    const fileExt = path.extname(fileRequest.name);
    const timeStamp = new Date().getTime();
    const fileContent = Buffer.from(fileRequest.data, 'binary');
    const fileName = `${timeStamp}${fileExt}`;
    const params = {
      Bucket: 'irc-ihumane', // pass your bucket name
      Key: fileName, // file will be saved as testBucket/contacts.csv
      Body: fileContent
    };
    await s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err);
      }
      s3Res = data.Location;
      resolve(s3Res);
    });
  });
};

module.exports = router;
