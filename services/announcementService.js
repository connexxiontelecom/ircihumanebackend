const { sequelize, Sequelize } = require('./db');
const announcementModel = require("../models/announcement")(sequelize, Sequelize.DataTypes);
const announcementAudienceModel = require("../models/announcementaudience")(sequelize, Sequelize.DataTypes);
const notificationModel = require("../models/notification")(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const mailer = require('../services/IRCMailer')
const Joi = require('joi');
const logs = require('../services/logService');
const employeeService = require('../services/employeeService');
const _ = require('lodash');
const path = require("path");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
});
const helper  =require('../helper');
const auth = require("../middleware/auth");
const leaveService = require("./leaveApplicationService");
const errHandler = (err) =>{
  console.log("Error: ", err);
}

const uploadFiles = async (req, res)=>{
  try{
    const announcementId = req.params.announcementId;
    const announcement = await announcementModel.getAnnouncementById(announcementId);
    if(_.isNull(announcement) || _.isEmpty(announcement)){
      return res.status(400).json("Record does not exist");
    }
    let docs = req.files.documents;
    if (Array.isArray(docs)) {

      let success = [];

      for (const doc of docs) {
        const uploadResponse = await uploadFile(doc).then((response) => {
          return response
        })
        await announcementModel.updateAnnouncementAttachmentUrl(announcementId, doc.name);
      }

      return res.status(200).json(`Action Successful`)
    }
    else {
      const uploadResponse = await uploadFile(docs).then((response) => {
        return response
      }).catch(err => {
        return res.status(400).json(err)
      })

      await announcementModel.updateAnnouncementAttachmentUrl(announcementId, uploadResponse);
      return res.status(200).json('Action Successful')
    }
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
  }
}



const publishAnnouncement = async (req, res, next)=>  {
  try{
    const schema = Joi.object( {
      author: Joi.number().required(),
      title: Joi.string().required(),
      body: Joi.string().required(),
      target: Joi.number().required().valid(1,2,3,4),
      persons: Joi.alternatives().conditional('target',{is: [2,3,4], then: Joi.array().required()}),
      attachment: Joi.allow("", null),
      viewUrl: Joi.string().required(),
    })
    const announcementRequest = req.body
    const validationResult = schema.validate(announcementRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const data = {
      a_author : parseInt(req.body.author),
      a_title : req.body.title,
      a_target : req.body.target,
      a_body: req.body.body,
    }
    const announce = await announcementModel.postAnnouncement(data);


    if(!(_.isEmpty(announce)) || !(_.isNull(announce))){
      const subject = "New announcement";
      const body = "You have new announcement.";
      const url = req.body.viewUrl; //req.headers.referer;
          switch (parseInt(req.body.target)){
            case 2:
              const persons = req.body.persons;
              persons.map(async (person) => {
                await announcementAudienceModel.createAudience(announce.a_id, person.value);
                const empUser = await employeeModel.getEmployeeById(person.value);
                const templateParams = {
                  firstName: `${empUser.emp_first_name}`,
                  title: `${req.body.title}`,
                }
                const notifyOfficer = await notificationModel.registerNotification(subject, body, person.value, 0, url);
                const mailerRes =  await mailer.sendAnnouncementNotification('noreply@ircng.org', empUser.emp_office_email, 'New Announcement', templateParams).then((data)=>{
                  return data
                })
              });
              break;
            case 3: //location
              const locationIds = [];
              const locations = req.body.persons;
              locations.map((locate)=>{
                locationIds.push(locate.value)
              });
              const employeesByLocation = await employeeModel.getEmployeesByLocationIds(locationIds);
              employeesByLocation.map(async (emp) => {
                const templateParams = {
                  firstName: `${emp.emp_first_name}`,
                  title: `${req.body.title}`,
                }
                await announcementAudienceModel.createAudience(announce.a_id, emp.emp_id);
                const notifyOfficer = await notificationModel.registerNotification(subject, body, emp.emp_id, 0, url);
                const mailerRes =  await mailer.sendAnnouncementNotification('noreply@ircng.org', emp.emp_office_email, 'New Announcement', templateParams).then((data)=>{
                  return data
                })
              });
              break;
            case 4: //sector
              const departmentIds = [];
              const departments = req.body.persons;
              departments.map((depart)=>{
                departmentIds.push(depart.value);
              });
              const employeesBySector = await employeeModel.getEmployeesBySectorIds(departmentIds);
              employeesBySector.map(async (empSec) => {
                const templateParams = {
                  firstName: `${empSec.emp_first_name}`,
                  title: `${req.body.title}`,
                }
                await announcementAudienceModel.createAudience(announce.a_id, empSec.emp_id);
                const notifyOfficer = await notificationModel.registerNotification(subject, body, empSec.emp_id, 0, url);
                const mailerRes =  await mailer.sendAnnouncementNotification('noreply@ircng.org', empSec.emp_office_email, 'New Announcement', templateParams).then((data)=>{
                  return data
                })
              });
              break;
          }
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Published an announcement`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(announce);
      })
    }else{
      return res.status(400).json(`Something went wrong.`);
    }

  }catch (e) {
    return res.status(400).json(`Something went wrong.`);

  }
}
const getAnnouncementByAuthor = async (req, res) =>{
  const empId  = req.params.id;
  try{
    const list =  await announcementModel.getAnnouncementsByAuthorId(empId);
    const data = {
      list
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}
const getAllAnnouncements = async (req, res) =>{
  try{
    const announcements =  await announcementModel.getAllAnnouncements();
    //const employees = await employeeService.getActiveEmployees()
    const data = {
      announcements
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later."+e.message);
  }
}
const getEmployeeAnnouncements = async (req, res)=>{
  const empId = req.params.id;
  try{
    const specifics =  await announcementAudienceModel.getAudienceById(empId);
    const publicAnnounce = await announcementModel.getPublicAnnouncements();
    let announcementIds = [];
    specifics.map((spec)=>{
      announcementIds.push(spec.aa_announcement_id);
    });
    publicAnnounce.map((pub)=>{
      announcementIds.push(pub.a_id);
    });

    const announcements = await announcementModel.getAnnouncementsById(announcementIds)
    const data = {
      announcements
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later."+e.message);
  }
}
const uploadFile = (fileRequest) => {
  return new Promise(async (resolve, reject) => {
    let s3Res;
    const fileExt = path.extname(fileRequest.name)
    const timeStamp = new Date().getTime()
    const fileContent = Buffer.from(fileRequest.data, 'binary');
    const fileName = `${timeStamp}${fileExt}`;
    const params = {
      Bucket: 'irc-ihumane', // pass your bucket name
      Key: fileName, // file will be saved as testBucket/contacts.csv
      Body: fileContent
    };
    console.log({s3})
    await s3.upload(params, function (s3Err, data) {
      //console.log({s3Err})
      if (s3Err) {
        reject(s3Err)
      }
      s3Res = data.Location
      resolve(s3Res)
    });
  })

}

module.exports = {
  publishAnnouncement,
  getAllAnnouncements,
  getAnnouncementByAuthor,
  getEmployeeAnnouncements,
  uploadFiles
}
