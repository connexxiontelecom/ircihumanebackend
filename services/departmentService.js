const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const department = require("../models/Department")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getDepartments = async (req, res)=>{
    try{
        const departments =  await department.findAll({attributes: ['department_name','department_id', 'd_t3_code']});
        res.status(200).json(departments);
    }catch (e) {
        res.status(500).json({message: "Something went wrong. Try again later"});
    }
}
const setNewDepartment = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            department_name: Joi.string().required(),
            t3_code: Joi.string().required(),
        })
        const departmentRequest = req.body
        const validationResult = schema.validate(departmentRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await department.create({department_name: req.body.department_name, d_t3_code:req.body.t3_code})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on department: Added a new department(${req.body.department_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New department :  ${req.body.department_name} was successfully saved in the database`);
        })
    }catch (e) {
        return res.status(400).json(`Error while adding payment definition `);

    }
}
const getDepartmentById = async (req, res) =>{
    const department_id  = req.params.id;
    try{
        const depart =  await department.findOne({where:{department_id: department_id}});
        return res.status(200).json(depart);
    }catch (e) {
        return res.status(400).json("Something went wrong. Try again later.");
    }
}
const updateDepartment = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            department_name: Joi.string().required(),
            t3_code: Joi.string().required(),
        })
        const departmentRequest = req.body
        const validationResult = schema.validate(departmentRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const department_id = req.params.id;
        const depart = await department.update({
            department_name: req.body.department_name,
            d_t3_code:req.body.t3_code
        },{
            where:{
                department_id:department_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on department: Made changes on (${req.body.department_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on   ${req.body.department_name} were saved successfully.`);
        });
    }catch (e) {
        return res.status(400).error(`Error while adding payment definition `);

    }
}

module.exports = {
    getDepartmentById,
    getDepartments,
    updateDepartment,
    setNewDepartment,
}