const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const location = require("../models/Location")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const logs = require('../services/logService');
const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getLocations = async (req, res)=>{
    const locations =  await location.findAll({attributes: ['location_name','location_id', 'l_state_id', 'l_t6_code']});
    res.send(locations)
}
const setNewLocation = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            location_name: Joi.string().required(),
            location_state: Joi.number().required(),
            location_t6_code: Joi.string().required(),
        });
        const locationRequest = req.body
        const validationResult = schema.validate(locationRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await location.create({
            location_name: req.body.location_name,
            l_state_id:req.body.location_state,
            l_t6_code:req.body.location_t6_code})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on location: Added location (${req.body.location_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New location :  ${req.body.location_name} was successfully saved in the database`);
        });

    }catch (e) {
        console.error(`Error while adding location `, e.message);
        next(e);
    }

}
const getLocationById = async (req, res) =>{
    const location_id  = req.params.id;
    const loc =  await location.findAll({where:{location_id: location_id}});
    res.send(loc);
}
const updateLocation = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            location_name: Joi.string().required(),
            location_state: Joi.number().required(),
            location_t6_code: Joi.string().required(),
        });
        const locationRequest = req.body
        const validationResult = schema.validate(locationRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const location_id = req.params.id;
        const loca = await location.update({
            location_name: req.body.location_name,
            l_t6_code:req.body.location_t6_code,
            l_state_id: req.body.location_state
        },{
            where:{
                location_id:location_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on location: Update on location (${req.body.location_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on :  ${req.body.location_name} was successfully saved in the database`);
        });

    }catch (e) {
        console.error(`Error while adding location `, e.message);
        next(e);
    }

}

module.exports = {
    getLocationById,
    getLocations,
    updateLocation,
    setNewLocation,
}