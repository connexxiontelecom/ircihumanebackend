const { QueryTypes } = require('sequelize')
const Joi = require('joi')

const { sequelize, Sequelize } = require('./db');
const PublicHoliday = require("../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')


const helper  = require('../helper');

const getAllPublicHolidays = async (req, res)=>{
    try {
        const holidays =  await PublicHoliday.findAll({attributes: ['ph_name', 'ph_day', 'ph_month', 'ph_year']});
        return res.status(200).json(holidays)
    } catch (err) {
        return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
    }
}

const setNewPublicHoliday = async (req, res)=>  {
    try{
        const schema = Joi.object( {
            public_name: Joi.string().required(),
            public_day: Joi.string().required(),
            public_month: Joi.string().required(),
            public_year: Joi.string().required(),
        })
        const publicRequest = req.body
        const validationResult = schema.validate(publicRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const { public_name, public_day, public_month, public_year } = req.body;
        await PublicHoliday.create({ph_name: public_name, ph_day:public_day, ph_month:public_month, ph_year:public_year})
            .catch(errHandler);
        //Log
       /* const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on public holiday: Added a new public holiday`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`New public holiday added successfully.`);
        });*/
    }catch (e) {
        return res.status(500).json({message:"Something went wrong. Try again later."});;

    }
}
const getPublicHolidayById = async (req, res) =>{
    const holiday_id  = req.params.id;
    try{
        const depart =  await PublicHoliday.findAll({where:{ph_id: holiday_id}});
        res.status(200).json(depart);
    }catch (e) {
        return res.status(500).json({message: "Something went wrong. Try again later"});
    }
}

/*
async function findAllLogs(){
    return await Log.findAll({ include: [User]})
}

async function addLog(log){

    try {
        const schema = Joi.object( {
            log_user_id: Joi.number().required(),
            log_description: Joi.string().required(),
            log_date: Joi.string().required(),
        })

        log.log_date = String(log.log_date)

        const validationResult = schema.validate(log)

        if(validationResult.error){
            return validationResult.error.details[0].message
        }
        return  await Log.create({
            log_user_id: log.log_user_id,
            log_description: log.log_description,
            log_date: log.log_date,

        })


    } catch (err) {
        return err.message

    }


}*/


module.exports = {
    setNewPublicHoliday,
    getAllPublicHolidays,
    getPublicHolidayById,
}
