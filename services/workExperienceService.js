const { sequelize, Sequelize } = require('./db');
const workExperienceModel = require("../models/workexperience")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const employeeService = require('../services/employeeService');
const _ = require('lodash');

const helper  =require('../helper');
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const addWorkExperience = async (req, res, next)=>  {
  try{
    const schema = Joi.object( {
      employee: Joi.number().required(),
      organization: Joi.string().required(),
      role: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),
    })
    const workRequest = req.body
    const validationResult = schema.validate(workRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const data = {
      we_emp_id : parseInt(req.body.employee),
      we_organization : req.body.organization,
      we_job_role : req.body.role,
      we_start_date: req.body.start_date,
      we_end_date: req.body.end_date,
    }
    const we = await workExperienceModel.addWorkExperience(data);
    if(!(_.isEmpty(we)) || !(_.isNull(we))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on work experience module`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Your changes were saved.`);
      })
    }else{
      return res.status(400).json(`Something went wrong.`);
    }

  }catch (e) {
    return res.status(400).json(`Something went wrong.`);

  }
}
const getEmployeeWorkExperienceList = async (req, res) =>{
  const empId  = req.params.id;
  try{
    const list =  await workExperienceModel.getEmployeeWorkExperienceList(empId);
    const employee = await employeeService.getEmployeeByIdOnly(empId);
    const data = {
      list,
      employee
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}
const updateWorkExperience = async (req, res)=>{
  try{
    const schema = Joi.object( {
      employee: Joi.number().required(),
      organization: Joi.string().required(),
      role: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),

    })
    const workRequest = req.body
    const validationResult = schema.validate(workRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const workId = req.params.id;
    const experience = await workExperienceModel.updateWorkExperience(req, workId);
    if(!(_.isEmpty(experience)) || !(_.isNull(experience))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Update on work experience`,
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
  addWorkExperience,
  updateWorkExperience,
  getEmployeeWorkExperienceList,
}
