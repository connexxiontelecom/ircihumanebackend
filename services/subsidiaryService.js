const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const subsidiary = require("../models/Subsidiary")(sequelize, Sequelize.DataTypes)
const Joi = require("joi");
const logs = require("../services/logService");
const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getSubsidiaries = async (req, res)=>{
    const subsidiaries =  await subsidiary.findAll({attributes: ['subsidiary_name','subsidiary_id']});
    res.status(200).json(subsidiaries)
}
const setNewSubsidiary = async (req, res, next)=>  {
    try{
    const schema = Joi.object( {
        subsidiary_name: Joi.string().required()
    });
    const subsidiaryRequest = req.body
    const validationResult = schema.validate(subsidiaryRequest)
    if(validationResult.error){
        return res.status(400).json(validationResult.error.details[0].message);
    }
    await subsidiary.create({subsidiary_name: req.body.subsidiary_name})
        .catch(errHandler);
    res.status(200).json(`New subsidiary :  ${req.body.subsidiary_name} was successfully saved in the database`)
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on subsidiary: Added subsidiary (${req.body.subsidiary_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            res.status(200).json(`Subsidiary:  ${req.body.subsidiary_name} was successfully saved in the database`);
        });
    }catch (e) {
        console.error(`Error while adding subsidiary `, e.message);
        next(e);
    }
}
const getSubsidiaryById = async (req, res) =>{
    const subsidiary_id  = req.params.id;
    const sub =  await subsidiary.findAll({where:{subsidiary_id: subsidiary_id}});
    res.send(sub);
}
const updateSubsidiary = async (req, res, next)=>{
    try {
        const schema = Joi.object({
            subsidiary_name: Joi.string().required()
        });
        const subsidiaryRequest = req.body
        const validationResult = schema.validate(subsidiaryRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const subsidiary_id = req.params.id;
        const subs = await subsidiary.update({
            subsidiary_name: req.body.subsidiary_name,
        },{
            where:{
                subsidiary_id:subsidiary_id
            }
        });
        res.send(`Your changes were saved successfully.`)
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on subsidiary: update on subsidiary (${req.body.subsidiary_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on   ${req.body.subsidiary_name} was successfully saved`);
        });
    }catch (e) {
        console.error(`Error while updating subsidiary `, e.message);
        next(e);
    }

}

module.exports = {
    getSubsidiaries,
    getSubsidiaryById,
    updateSubsidiary,
    setNewSubsidiary,
}
