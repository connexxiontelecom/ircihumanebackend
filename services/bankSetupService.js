const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const bank = require("../models/Bank")(sequelize, Sequelize.DataTypes)
const auth = require("../middleware/auth");
const logs = require('../services/logService');
const jwt = require('jsonwebtoken');

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getBanks = async (req, res)=>{
    try {
        const banks =  await bank.findAll({attributes: ['bank_name', 'bank_id', 'bank_code']});
        return res.status(200).json(banks)

    } catch (err) {
        return res.status(500).json({message: `Error while fetching banks ${err.message}`})
    }
}
const setNewBank = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            bank_name: Joi.string().required(),
            bank_code: Joi.string().required(),
        });
        const bankRequest = req.body
        const validationResult = schema.validate(bankRequest)
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const n_bank = await bank.create({bank_name: req.body.bank_name, bank_code: req.body.bank_code})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on bank: Added new bank (${req.body.bank_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Bank ${req.body.bank_name} was successfully saved in the database`);
        })
    }catch (e) {
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }


}
const getBankById = async (req, res) =>{
    const bank_id  = req.params.id;
    const b =  await bank.findAll({where:{bank_id: bank_id}});
    return res.status(200).json(b)

}
const updateBank = async (req, res, next)=>{
    const bank_id = req.params.id;
    try{
        const schema = Joi.object( {
            bank_name: Joi.string().required(),
            bank_code: Joi.string().required(),
        })
        const bankRequest = req.body
        const validationResult = schema.validate(bankRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const b = await bank.update({
            bank_name: req.body.bank_name,
            bank_code: req.body.bank_code
        },{
            where:{
                bank_id:bank_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on bank: Made changes on ${req.body.bank_name} bank`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes were saved successfully.`);
        });
    }catch (e) {
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }
}

module.exports = {
    getBanks,
    setNewBank,
    getBankById,
    updateBank,
}
