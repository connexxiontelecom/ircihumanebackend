const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const BudgeHolderModel = require("../models/BudgetHolder")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const setNewBudgetHolder = async (user_id, grant)=>  {
    try{
       /* const schema = Joi.object( {
            employee: Joi.string().required(),
            grant: Joi.string().required(),
        })
        const budgetRequest = req.body
        const validationResult = schema.validate(budgetRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }*/
        await BudgeHolderModel.create({bh_employee_id: user_id, bh_grant_id:grant})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id":user_id,
            "log_description": `Log on budget holder: Added a new budget holder`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
           // return res.status(200).json(`New budget holder was successfully saved in the database`);
        })
    }catch (e) {
        console.error(`Error while adding payment definition `, e.message);
       // next(e);
    }
}

module.exports = {
    setNewBudgetHolder
}