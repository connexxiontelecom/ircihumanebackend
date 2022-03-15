const Joi = require('joi');
const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const sectorLeadModel = require("../models/SectorLead")(sequelize, Sequelize.DataTypes);
const departmentModel = require("../models/Department")(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}
const getSectorLeads = async (req, res) => {
    // const sector_leads =  await sectorLeadModel.findAll({attributes: ['sl_id','sl_employee_id', 'sl_sector_id']});
    const sector_leads = await sectorLeadModel.findAll({
        attributes: ['sl_id', 'sl_employee_id', 'sl_sector_id'],
        include: [departmentModel, employeeModel]
    });
    return res.status(200).json(sector_leads)
}
const setNewSectorLead = async (req, res, next) => {
    try {
        const schema = Joi.object({
            sector: Joi.string()
                .required()
                .messages({'any.required': 'Sector lead is required'}),
            employee: Joi.string()
                .required()
                .messages({'any.required': 'Employee field is required'}),
        })
        const sectorLeadRequest = req.body
        const validationResult = schema.validate(sectorLeadRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const existingSector = await sectorLeadModel.findOne({where: {sl_sector_id: req.body.sector}});
        const existingLead = await sectorLeadModel.findOne({where: {sl_employee_id: req.body.employee}});
        if (existingSector !== null && existingLead !== null) {
            return res.status(400).json({message: "There's already existing sector lead."});
        }

        await sectorLeadModel.create({sl_sector_id: req.body.sector, sl_employee_id: req.body.employee})
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on sector lead: Added a new sector lead`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New sector lead  was successfully saved`);
        })
    } catch (e) {
        res.status(400).json({message: `Error while adding state ${e.message}`});

    }
}
const getSectorLeadById = async (req, res) => {
    const sectorId = req.params.id;
    try {
        const sector = await sectorLeadModel.findAll({where: {sl_id: sectorId}});
        return res.status(200).json(sector);
    } catch (e) {
        return res.status(400).json({message: "Something went wrong. Try again later."});
    }

}
const updateSectorLead = async (req, res, next) => {
    try {
        const schema = Joi.object({
            sector: Joi.string()
                .required()
                .messages({'any.required': 'Sector lead is ran equired'}),
            employee: Joi.string()
                .required()
                .messages({'any.required': 'Employee field is required'}),
        })
        const sectorRequest = req.body
        const validationResult = schema.validate(sectorRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const sectorId = req.params.id;
        const stat = await sectorLeadModel.update({
            sl_employee_id: req.body.employee,
            sl_sector_id: req.body.sector
        }, {
            where: {
                sl_id: sectorId
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on sector lead: Made changes on sector lead`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`Your changes on sector lead were saved successfully.`);
        });
    } catch (e) {
        console.error(`Error while updating state `, e.message);
        next(e);
    }
}

module.exports = {
    getSectorLeadById,
    getSectorLeads,
    updateSectorLead,
    setNewSectorLead,
}