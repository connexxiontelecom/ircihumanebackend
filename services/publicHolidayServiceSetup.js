const {QueryTypes} = require('sequelize')
const Joi = require('joi')
const isBefore = require('date-fns/isBefore')
const {sequelize, Sequelize} = require('./db');
const PublicHoliday = require("../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')


const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}
const getAllPublicHolidays = async (req, res) => {
    try {
        const holidays = await PublicHoliday.findAll({
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year', 'ph_to_day', 'ph_to_month', 'ph_to_year']
        });
        return res.status(200).json(holidays)
    } catch (err) {
        return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
    }
}

const setNewPublicHoliday = async (req, res) => {
    try {
        const schema = Joi.object({
            public_name: Joi.string().required(),
            public_date: Joi.date().required(),
            public_date_to: Joi.date().required(),
        })
        const publicRequest = req.body
        const validationResult = schema.validate(publicRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const {public_name, public_date, public_date_to} = req.body;
        const date = new Date(public_date);
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        const to_date = new Date(public_date_to);
        const to_day = to_date.getUTCDate();
        const to_month = to_date.getUTCMonth() + 1;
        const to_year = to_date.getUTCFullYear();


        const existPeriod = await PublicHoliday.findOne({
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year'],
            where: {
                ph_day: day,
                ph_month: month,
                ph_year: year
            }
        });
        if (existPeriod) return res.status(400).json("There's an existing public holiday with these entry.");
        const pubData = {
            ph_name: public_name,
            ph_day: day,
            ph_month: month,
            ph_year: year,
            ph_date: public_date,

            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_to_month: to_month,
            ph_to_year: to_year,
        };

        await PublicHoliday.create(pubData)
            .catch(errHandler);
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on public holiday: Added a new public holiday`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New public holiday added successfully.`);
        });
    } catch (e) {
        return res.status(500).json({message: "Something went wrong. Try again later." + e.message});
        ;

    }
}
const updatePublicHoliday = async (req, res) => {
    try {
        const publicHolidayId = req.params.id;
        const schema = Joi.object({
            public_name: Joi.string().required(),
            public_date: Joi.date().required(),
            public_date_to: Joi.date().required(),
        })
        const publicRequest = req.body
        const validationResult = schema.validate(publicRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        //const { public_name, public_day, public_month, public_year} = req.body;
        const {public_name, public_date, public_date_to} = req.body;
        let startDate = new Date(public_date);
        let endDate = new Date(public_date_to);
        if (isBefore(startDate, new Date())) {
            return res.status(400).json('Start date cannot be before today or today.')
        }
        if (isBefore(endDate, new Date())) {
            return res.status(400).json('End date cannot be before today or today')
        }
        const date = new Date(public_date);
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        const to_date = new Date(public_date_to);
        const to_day = to_date.getUTCDate();
        const to_month = to_date.getUTCMonth() + 1;
        const to_year = to_date.getUTCFullYear();
        const pubData = {
            ph_name: public_name,
            ph_day: day,
            ph_month: month,
            ph_year: year,
            ph_date: public_date,

            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_to_month: to_month,
            ph_to_year: to_year,
        };
        //console.log(public_date_to);
        //return res.status(200).json(public_date_to);
        const updateRecord = await PublicHoliday.update(
            pubData,
            {
                where: {
                    ph_id: publicHolidayId
                }
            });
        if (!updateRecord) return res.status(400).json("There's an existing public holiday with these entry.");

        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on public holiday: Added a new public holiday`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New public holiday added successfully.`);
        });
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again later." + e.message);

    }
}
const getPublicHolidayById = async (req, res) => {
    const holiday_id = req.params.id;
    try {
        const depart = await PublicHoliday.findAll({where: {ph_id: holiday_id}});
        res.status(200).json(depart);
    } catch (e) {
        return res.status(500).json({message: "Something went wrong. Try again later"});
    }
}

async function fetchAllPublicHolidays() {
    return await PublicHoliday.findAll()
}

async function fetchPublicHolidayByYear(year) {
    return await PublicHoliday.findAll({
        where: {
            ph_year: year
        }
    })
}

async function fetchSpecificPublicHoliday(day, month, year) {
    return await PublicHoliday.findAll({
        where: {
            ph_day: day,
            ph_month: month,
            ph_year: year
        }
    })
}

async function fetchPublicHolidayByMonthYear(month, year) {
    return await PublicHoliday.findAll({
        where: {
            ph_month: month,
            ph_year: year
        }
    })
}


module.exports = {
    setNewPublicHoliday,
    getAllPublicHolidays,
    getPublicHolidayById,
    fetchAllPublicHolidays,
    fetchPublicHolidayByYear,
    fetchSpecificPublicHoliday,
    updatePublicHoliday
}
