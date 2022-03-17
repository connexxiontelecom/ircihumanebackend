const { sequelize, Sequelize } = require('./db');
const announcementModel = require("../models/announcement")(sequelize, Sequelize.DataTypes);
const announcementAudienceModel = require("../models/announcementaudience")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const employeeService = require('../services/employeeService');
const _ = require('lodash');

const helper  =require('../helper');
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const publishAnnouncement = async (req, res, next)=>  {
  try{
    const schema = Joi.object( {
      author: Joi.number().required(),
      title: Joi.string().required(),
      body: Joi.string().required(),
      target: Joi.number().required().valid(1,2),
      persons: Joi.alternatives().conditional('target',{is: 2, then: Joi.array().required()}),
      attachment: Joi.allow("", null),
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
        const persons = req.body.persons;
        persons.map((person)=>{
          announcementAudienceModel.createAudience(announce.a_id, person.value);
        });
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Published an announcement`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Announcement published.`);
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
    return res.status(400).json("Something went wrong. Try again later.");
  }
}
const updateEducation = async (req, res)=>{
  try{
    const schema = Joi.object( {
      employee: Joi.number().required(),
      institution: Joi.string().required(),
      program: Joi.string().required(),
      qualification: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),

    })
    const educationRequest = req.body
    const validationResult = schema.validate(educationRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const educationId = req.params.id;
    const education = await educationModel.updateEducation(req, educationId);
    if(!(_.isEmpty(education)) || !(_.isNull(education))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Update on education`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Your changes were saved.`);
      });
    }else{
      return res.status(400).error(`Something went wrong `);
    }

  }catch (e) {
    return res.status(400).error(`Something went wrong `);

  }
}

module.exports = {
  publishAnnouncement,
  getAllAnnouncements,
  getAnnouncementByAuthor
}
