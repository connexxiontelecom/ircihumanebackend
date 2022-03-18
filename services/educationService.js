const { sequelize, Sequelize } = require('./db');
const educationModel = require("../models/education")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const employeeService = require('../services/employeeService');
const _ = require('lodash');

const helper  =require('../helper');
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const addEducation = async (req, res, next)=>  {
  try{
    const schema = Joi.object( {
        employee: Joi.number().required(),
        institution: Joi.string().required(),
        program: Joi.string().required(),
        qualification: Joi.string().required(),
        start_date: Joi.string().required(),
        end_date: Joi.string().required(),
    })
    //return res.status(200).json("Okay");
    const educationRequest = req.body
    const validationResult = schema.validate(educationRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const data = {
      e_emp_id : parseInt(req.body.employee),
        e_institution : req.body.institution,
      e_program : req.body.program,
      e_qualification: req.body.qualification,
      e_start_date: req.body.start_date,
      e_end_date: req.body.end_date,
    }
    const ed = await educationModel.addEducation(data);
    if(!(_.isEmpty(ed)) || !(_.isNull(ed))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on education module`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Your changes were saved.`);
      })
    }else{
      return res.status(400).json(`Something went wrong. ${e.message}`);
    }

  }catch (e) {
    return res.status(400).json(`Something went wrong. ${e.message}`);

  }
}
const getEmployeeEducationList = async (req, res) =>{
  const empId  = req.params.id;
  try{
    const list =  await educationModel.getEmployeeEducationList(empId);
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
  addEducation,
  updateEducation,
  getEmployeeEducationList
}
