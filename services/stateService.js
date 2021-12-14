const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const state = require("../models/State")(sequelize, Sequelize.DataTypes);
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getStates = async (req, res)=>{
    const states =  await state.findAll({attributes: ['s_name','s_id']});
    return res.status(200).json(states)
}
const setNewState = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            state_name: Joi.string().required()
        })
        const stateRequest = req.body
        const validationResult = schema.validate(stateRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await state.create({s_name: req.body.state_name})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on state: Added a new state(${req.body.state_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New state :  ${req.body.state_name} was successfully saved`);
        })
    }catch (e) {
        console.error(`Error while adding state `, e.message);
        next(e);
    }
}
const getStateById = async (req, res) =>{
    const state_id  = req.params.id;
    const sta =  await state.findAll({where:{s_id: state_id}});
    return res.status(200).json(sta);
}
const updateState = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            state_name: Joi.string().required()
        })
        const stateRequest = req.body
        const validationResult = schema.validate(stateRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const state_id = req.params.id;
        const stat = await state.update({
            s_name: req.body.state_name
        },{
            where:{
                s_id:state_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on state: Made changes on (${req.body.state_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on   ${req.body.state_name} were saved successfully.`);
        });
    }catch (e) {
        console.error(`Error while updating state `, e.message);
        next(e);
    }
}

module.exports = {
    getStateById,
    getStates,
    updateState,
    setNewState,
}