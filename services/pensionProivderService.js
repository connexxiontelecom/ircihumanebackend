const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const pension = require("../models/PensionProvider")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const logs = require('../services/logService');
const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}
const getPensionProviders = async (req, res) => {
    const providers = await pension.findAll({attributes: ['provider_name', 'pension_provider_id', 'provider_code']});
    res.status(200).json(providers)
}
const setNewPensionProvider = async (req, res, next) => {
    try {
        const schema = Joi.object({
            provider_name: Joi.string().required(),
            provider_code: Joi.string().required()
        });
        const pensionRequest = req.body
        const validationResult = schema.validate(pensionRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        await pension.create({provider_name: req.body.provider_name, provider_code: req.body.provider_code})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on location: Added location (${req.body.provider_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            res.status(200).json(`Pension provider:  ${req.body.provider_name} was successfully saved in the database`);
        });
    } catch (e) {
        console.error(`Error while adding location `, e.message);
        next(e);
    }

}
const getPensionProviderById = async (req, res) => {
    const provider_id = req.params.id;
    const p = await pension.findAll({where: {pension_provider_id: provider_id}});
    res.status(200).json(p);
}
const updatePensionProvider = async (req, res) => {
    try {
        const schema = Joi.object({
            provider_name: Joi.string().required(),
            provider_code: Joi.string().required()
        });
        const pensionRequest = req.body
        const validationResult = schema.validate(pensionRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const provider_id = req.params.id;
        const b = await pension.update({
            provider_name: req.body.provider_name,
            provider_code: req.body.provider_code
        }, {
            where: {
                pension_provider_id: provider_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on pension provider: Update on location (${req.body.provider_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`Your changes on :  ${req.body.provider_name} was successfully saved`);
        });
    } catch (e) {

    }

}

module.exports = {
    getPensionProviderById,
    getPensionProviders,
    updatePensionProvider,
    setNewPensionProvider,
}
