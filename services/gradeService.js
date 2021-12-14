const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const grade = require("../models/Grade")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getGrades = async (req, res)=>{
    const grades =  await grade.findAll({attributes: ['grade_name','grade_id']});
    res.status(200).json(grades)
}
const setNewGrade = async (req, res)=>  {
    try{
        const schema = Joi.object( {
            grade_name: Joi.string().required(),
        });
        const gradeRequest = req.body
        const validationResult = schema.validate(gradeRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await grade.create({grade_name: req.body.grade_name})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on grade: Added grade (${req.body.grade_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New grade :  ${req.body.grade_name} was successfully saved in the database`);
        });
    }catch (e) {
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }

}
const getGradeById = async (req, res) =>{
    const grade_id  = req.params.id;
    const grade =  await grade.findAll({where:{grade_id: grade_id}});
    res.send(grade);
}
const updateGrade = async (req, res)=>{
    try{
        const schema = Joi.object( {
            grade_name: Joi.string().required(),
        });
        const gradeRequest = req.body
        const validationResult = schema.validate(gradeRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const grade_id = req.params.id;
        const grade = await grade.update({
            grade_name: req.body.grade_name,
        },{
            where:{
                grade_id:grade_id
            }
        });
        res.status(200).json(`Your changes were saved successfully.`)
    }catch (e) {
        console.error(`Error while adding grade `, e.message);
        next(e);
    }

}

module.exports = {
    getGradeById,
    getGrades,
    updateGrade,
    setNewGrade,
}
