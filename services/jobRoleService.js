const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const jobRole = require("../models/JobRole")(sequelize, Sequelize.DataTypes);
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes);

const Joi = require('joi');
const auth = require("../middleware/auth");
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getJobRoles = async (req, res)=>{
    const roles =  await jobRole.findAll({attributes: ['job_role','jb_department_id', 'job_role_id', 'description'], include:[Department]});
    //return await jobRole.findAll({ include: [Location, Pd] })
    res.status(200).json(roles)
}
const setNewJobRole = async (req, res)=>  {
    try{
        const schema = Joi.object( {
            job_role: Joi.string().required(),
            department_id: Joi.number().required(),
            description: Joi.string().required()
        });
        const jobRoleRequest = req.body
        const validationResult = schema.validate(jobRoleRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await jobRole.create({job_role: req.body.job_role,jb_department_id:req.body.department_id,description:req.body.description})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on job role: Added job role (${req.body.job_role})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New job role :  ${req.body.job_role} was successfully saved in the database`);
        });
    }catch (e) {
        console.error(`Error while adding job role `, e.message);
        next(e);
    }

}
const getJobRoleById = async (req, res) =>{
    const role_id  = req.params.id;
    const role =  await jobRole.findAll({where:{job_role_id: role_id}});
    res.status(200).json(role);
}
const updateJobRole = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            job_role: Joi.string().required(),
            department_id: Joi.number().required(),
            description: Joi.string().required()
        });
        const jobRoleRequest = req.body
        const validationResult = schema.validate(jobRoleRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const role_id = req.params.id;
        const role = await jobRole.update({
            job_role: req.body.job_role,
            description:req.body.description,
            jb_department_id:req.body.department_id
        },{
            where:{
                job_role_id:role_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on job role: Update on job role (${req.body.job_role})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes were saved successfully.`);
        });
    }catch (e) {
        console.error(`Error while adding job role `, e.message);
        next(e);
    }

}

module.exports = {
    getJobRoleById,
    getJobRoles,
    updateJobRole,
    setNewJobRole,
}
