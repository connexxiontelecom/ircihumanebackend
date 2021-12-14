const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const employeeCategory = require("../models/EmployeeCategories")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getEmployeeCategories = async (req, res)=>{
    const employeeCats =  await employeeCategory.findAll({attributes: ['ec_name','ec_id']});
    return res.status(200).json(employeeCats)
}
const setNewEmployeeCategory = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            employee_cat_name: Joi.string().required()
        })
        const employeeCatRequest = req.body
        const validationResult = schema.validate(employeeCatRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await employeeCategory.create({ec_name: req.body.employee_cat_name})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on employee category: Added a new employee category (${req.body.employee_cat_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New employee category :  ${req.body.employee_cat_name} was successfully saved`);
        })
    }catch (e) {
        console.error(`Error while adding employee category `, e.message);
        next(e);
    }
}
const getEmployeeCategoryById = async (req, res) =>{
    const ec_id  = req.params.id;
    const ec =  await employeeCategory.findAll({where:{ec_id: ec_id}});
    return res.status(200).json(ec);
}
const updateEmployeeCategory = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            employee_cat_name: Joi.string().required()
        })
        const employeeCatRequest = req.body
        const validationResult = schema.validate(employeeCatRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const ec_id = req.params.id;
        const stat = await employeeCategory.update({
            ec_name: req.body.employee_cat_name
        },{
            where:{
                ec_id:ec_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on employee category: Made changes on (${req.body.employee_cat_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on   ${req.body.employee_cat_name} were saved successfully.`);
        });
    }catch (e) {
        console.error(`Error while updating employee category `, e.message);
        next(e);
    }
}

module.exports = {
    getEmployeeCategories,
    getEmployeeCategoryById,
    updateEmployeeCategory,
    setNewEmployeeCategory,
}