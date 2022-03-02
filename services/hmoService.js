const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const hmo = require("../models/Hmo")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const auth = require("../middleware/auth");
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getHmos = async (req, res)=>{
    const hmos =  await hmo.findAll({attributes: ['hmo_name','hmo_id']});
    res.status(200).json(hmos)
}
const setNewHmo = async (req, res)=>  {
    try{
        const schema = Joi.object( {
            hmo_name: Joi.string().required()
        });
        const hmoRequest = req.body
        const validationResult = schema.validate(hmoRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await hmo.create({hmo_name: req.body.hmo_name})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on HMO: Added new HMO (${req.body.hmo_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New HMO :  ${req.body.hmo_name} was successfully saved in the database`);
        })
    }catch (e) {
        console.error(`Error while adding HMO `, e.message);
        next(e);
    }

}
const getHmoById = async (req, res) =>{
    const hmo_id  = req.params.id;
    const h =  await hmo.findAll({where:{hmo_id: hmo_id}});
    res.send(h);
}
const updateHmo = async (req, res)=>{
    try{
        const schema = Joi.object( {
            hmo_name: Joi.string().required()
        });
        const hmoRequest = req.body
        const validationResult = schema.validate(hmoRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const hmo_id = req.params.id;
        const h = await hmo.update({
            hmo_name: req.body.hmo_name,
        },{
            where:{
                hmo_id:hmo_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on HMO: Update on HMO (${req.body.hmo_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes :  ${req.body.hmo_name} was successfully saved in the database`);
        })
    }catch(e){
        console.error(`Error while updating HMO `, e.message);
        next(e);
    }
}

module.exports = {
    getHmoById,
    getHmos,
    updateHmo,
    setNewHmo,
}
