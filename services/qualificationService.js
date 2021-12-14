const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const qualification = require("../models/Qualification")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const logs = require('../services/logService');
const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getQualifications = async (req, res)=>{
    const qualifications =  await qualification.findAll({attributes: ['qualification_name','qualification_id']});
    res.status(200).json(qualifications)
}
const setNewQualification = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            qualification_name: Joi.string().required()
        });
        const qualificationRequest = req.body
        const validationResult = schema.validate(qualificationRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await qualification.create({qualification_name: req.body.qualification_name})
            .catch(errHandler);

        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on qualification: Added qualification (${req.body.qualification_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            res.status(200).json(`Qualification:  ${req.body.qualification_name} was successfully saved in the database`);
        });
    }catch (e) {
        console.error(`Error while adding location `, e.message);
        next(e);
    }

}
const getQualificationById = async (req, res) =>{
    const qualification_id  = req.params.id;
    const qualifi =  await qualification.findAll({where:{qualification_id: qualification_id}});
    res.status(200).json(qualifi);
}
const updateQualification = async (req, res)=>{
    try{
        const schema = Joi.object( {
            qualification_name: Joi.string().required()
        });
        const qualificationRequest = req.body
        const validationResult = schema.validate(qualificationRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }

        const qualification_id = req.params.id;
        const quali = await qualification.update({
            qualification_name: req.body.qualification_name,
        },{
            where:{
                qualification_id:qualification_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on qualification: Update on qualification (${req.body.qualification_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on :  ${req.body.qualification_name} was successfully saved`);
        });
    }catch (e) {

    }

}

module.exports = {
    getQualificationById,
    getQualifications,
    updateQualification,
    setNewQualification,
}
