const { sequelize, Sequelize } = require('./db');
const localGovernmentModel = require("../models/localgovernment")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const _ = require('lodash');

const helper  =require('../helper');
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const addLga = async (req, res, next)=>  {
  try{
    const schema = Joi.object( {
      state: Joi.number().required(),
      lg_name: Joi.string().required()
    })
    const lgaRequest = req.body
    const validationResult = schema.validate(lgaRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const data = {
      lg_name:req.body.lg_name,
      lg_state_id:req.body.state
    }
    const lga = await localGovernmentModel.addLocalGovernment(data);
    if(!(_.isEmpty(lga)) || !(_.isNull(lga))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on LGA: Added a new local government area(${req.body.lg_name})`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`New LGA :  ${req.body.lg_name} was successfully saved`);
      })
    }else{
      return res.status(400).json(`Something went wrong. ${e.message}`);
    }

  }catch (e) {
    return res.status(400).json(`Something went wrong. ${e.message}`);

  }
}
const getLocalGovernmentByStateId = async (req, res) =>{
  const state  = req.params.id;
  try{
    const lgas =  await localGovernmentModel.getAllLocalGovernmentsByStateId(state);
    return res.status(200).json(lgas);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}
const getLocalGovernments = async (req,res) =>{
  try{
    const lgas =  await localGovernmentModel.getAllLocalGovernments();
    return res.status(200).json(lgas);
  }catch (e) {
    return res.status(400).json("Whoops! Something went wrong. Try again."+e.message);
  }


}
const updateLocalGovernment = async (req, res, next)=>{
  try{
    const schema = Joi.object( {
      state: Joi.number().required(),
      lg_name: Joi.string().required(),

    })
    const localRequest = req.body
    const validationResult = schema.validate(localRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const lgaId = req.params.id;
    const local = await localGovernmentModel.updateLocationGovernment(req, lgaId);
    if(!(_.isEmpty(local)) || !(_.isNull(local))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `changes made on LGA`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Your changes on   ${req.body.department_name} were saved successfully.`);
      });
    }else{
      return res.status(400).error(`Something went wrong `);
    }

  }catch (e) {
    return res.status(400).error(`Something went wrong `);

  }
}

module.exports = {
  getLocalGovernmentByStateId,
  addLga,
  getLocalGovernments,
  updateLocalGovernment,
}
