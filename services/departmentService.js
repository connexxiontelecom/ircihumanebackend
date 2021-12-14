const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const department = require("../models/Department")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getDepartments = async (req, res)=>{
    const departments =  await department.findAll({attributes: ['department_name','department_id']});
    res.status(200).json(departments)
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
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }
}
const getDepartmentById = async (req, res) =>{
    const department_id  = req.params.id;
    const depart =  await department.findAll({where:{department_id: department_id}});
    res.send(depart);
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
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }
}

module.exports = {
    getDepartmentById,
    getDepartments,
    updateDepartment,
    setNewDepartment,
}