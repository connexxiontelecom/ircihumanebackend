const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const leaveType = require("../models/LeaveType")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const auth = require("../middleware/auth");
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}

const getLeaveTypes = async (req, res)=>{
    const leaves =  await leaveType.findAll({attributes: ['leave_name','leave_type_id', 'leave_duration', 'lt_rate', 'lt_mode', 'lt_accrue']});
    res.status(200).json(leaves)
}

const setNewLeaveType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            leave_name: Joi.string().required(),
            leave_mode: Joi.number().required(),
            leave_rate: Joi.number().precision(2).required(),
            leave_duration: Joi.number().required(),
            leave_accrue: Joi.number().required()
        });
        const leaveRequest = req.body
        const validationResult = schema.validate(leaveRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }

        await leaveType.create({
            leave_name: req.body.leave_name,
            leave_duration: req.body.leave_duration,
            lt_mode: req.body.leave_mode,
            lt_rate: req.body.leave_rate,
            lt_accrue: req.body.leave_accrue
        })
            .catch(errHandler);
        res.send(`New leave :  ${req.body.leave_name} was successfully saved in the database`)
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on job role: Added leave type (${req.body.leave_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New leave type :  ${req.body.leave_name} was successfully saved in the database`);
        });
    } catch (e) {
        console.error(`Error while adding leave type `, e.message);
        next(e);
    }

}
const getLeaveTypeById = async (req, res) => {
    const leave_type_id = req.params.id;
    const leave = await leaveType.findAll({where: {leave_type_id: leave_type_id}});
    res.status(200).json(leave);
}
const updateLeaveType = async (req, res) => {
    try {
        const schema = Joi.object({
            leave_name: Joi.string().required(),
            leave_duration: Joi.number().required(),
            leave_mode: Joi.number().required(),
            leave_rate: Joi.number().precision(2).required(),
            leave_accrue: Joi.number().required()
        });
        const leaveRequest = req.body
        const validationResult = schema.validate(leaveRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        //return res.send(req.body);
        const leave_id = req.params.id;
        const subs = await leaveType.update({
            leave_name: req.body.leave_name,
            leave_duration: req.body.leave_duration,
            lt_mode: req.body.leave_mode,
            lt_rate: req.body.leave_rate,
            lt_accrue: req.body.leave_accrue
        }, {
            where: {
                leave_type_id: leave_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on leave type: Update on leave type (${req.body.leave_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`Your changes on leave type :  ${req.body.leave_name} was successfully saved in the database`);
        });

    } catch (e) {
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }

}

async function getAllLeaves() {
    return await leaveType.findAll()
}

async function getAllEmployeeLeavesTypesByRelocatableStatus(status) {
    return await leaveType.findAll({
      where:{ lt_rr: [status,0], }
    })
}

async function getAccruableLeaves() {
    return await leaveType.findAll({
        where: {
            lt_accrue: 1
        }
    })
}

async function getLeavesWithOptions(accruable, relocatable, mode) {
    return await leaveType.findAll({
        where: {
            lt_accrue: accruable,
            lt_rr: relocatable,
            lt_mode: mode
        }
    })
}

async function getLeaveType(leaveTypeId) {
    return await leaveType.findOne({
        where: {
            leave_type_id: leaveTypeId
        }
    })
}
async function getLeaveTypeByName(leaveName) {
    return await leaveType.findOne({
        where: {
            leave_name: leaveName
        }
    })
}


module.exports = {
    getLeaveTypes,
    getLeaveTypeById,
    updateLeaveType,
    setNewLeaveType,
    getAllLeaves,
    getAccruableLeaves,
    getLeaveType,
    getLeaveTypeByName,
  getAllEmployeeLeavesTypesByRelocatableStatus,
    getLeavesWithOptions
}
