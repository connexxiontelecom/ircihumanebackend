const {QueryTypes} = require('sequelize')
const Joi = require('joi')
const _ = require('lodash');
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
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_group', 'ph_month', 'ph_year', 'ph_to_day', 'ph_to_month', 'ph_to_year'],
            group: ['ph_group']
        });
        return res.status(200).json(holidays)
    } catch (err) {
        return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
    }
}
const getCurrentYearPublicHolidays = async (req, res) => {
    try {
        const holidays = await PublicHoliday.getThisYearsPublicHolidays();
        return res.status(200).json(holidays)
    } catch (err) {
        return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
    }
}
const getAllIndividualPublicHolidays = async (req, res) => {
    try {
        const holidays = await PublicHoliday.findAll({
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_group', 'ph_month', 'ph_year', 'ph_to_day', 'ph_to_month', 'ph_to_year'],
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

        const numDays = (to_date.getTime() - date.getTime())/(1000*60*60*24);
        //return res.status(400).json(`${day+1}`);



       /* const existPeriod = await PublicHoliday.findOne({
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year'],
            where: {
                ph_day: day,
                ph_month: month,
                ph_year: year
            }
        });

        if (existPeriod) return res.status(400).json("There's an existing public holiday with these entry.");*/
      const group = Math.floor(Math.random() * 1001);
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
            ph_group: group,
        };
        let i = 0;
          if(numDays > 0){
            for(i=0; i<= numDays; i++){
              const loopPub = {
                ph_day: i === 0 ? day : (day + i) ,
                ph_date: i === 0 ? date : date.getTime() + (i*24*60*60*1000) ,
                ph_to_date: public_date_to,
                ph_to_day: to_day,
                ph_name: public_name,
                ph_month: month,
                ph_to_month: to_month,
                ph_to_year: to_year,
                ph_year: year,
                ph_group: group,
              }
              await PublicHoliday.create(loopPub)
                .catch(errHandler);
            }
          }else{
            await PublicHoliday.create(pubData)
              .catch(errHandler);
          }
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
            group: Joi.string().required(),
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
        const publicHols = await PublicHoliday.getPublicHolidayByGroup(req.body.group);
        //return res.status(400).json(publicHols);
        if(!(_.isNull(publicHols)) || !(_.isEmpty(publicHols))){
            await PublicHoliday.destroyPublicHolidayByGroup(req.body.group);
        }/*else{
          const updateRecord = await PublicHoliday.update(
            pubData,
            {
              where: {
                ph_id: publicHolidayId
              }
            });
          if (!updateRecord) return res.status(400).json("There's an existing public holiday with these entry.");
        }*/
      const numDays = (to_date.getTime() - date.getTime())/(1000*60*60*24);
      //return res.status(400).json(numDays);



      /* const existPeriod = await PublicHoliday.findOne({
           attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year'],
           where: {
               ph_day: day,
               ph_month: month,
               ph_year: year
           }
       });

       if (existPeriod) return res.status(400).json("There's an existing public holiday with these entry.");*/
      const group = Math.floor(Math.random() * 1001);
      let i = 0;
      if(numDays > 0){
        for(i=0; i<= numDays; i++){
          const loopPub = {
            ph_day: i === 0 ? day : (day + i) ,
            ph_date: i === 0 ? date : date.getTime() + (i*24*60*60*1000) ,
            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_name: public_name,
            ph_month: month,
            ph_to_month: to_month,
            ph_to_year: to_year,
            ph_year: year,
            ph_group: group,
          }
          await PublicHoliday.create(loopPub)
            .catch(errHandler);
        }
      }else{
        await PublicHoliday.create(pubData)
          .catch(errHandler);
      }
        //console.log(public_date_to);
        //return res.status(200).json(public_date_to);


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

const  deletePublicHolidayByGroup = async (req, res) =>{
  try{
    const groupId = req.params.id;
    const pubHols = await PublicHoliday.getPublicHolidayByGroup(groupId);

    if(_.isNull(pubHols) || _.isEmpty(pubHols)){
      return res.status(400).json("Whoops! No record found.")
    }
    const deleteHols =  await PublicHoliday.destroyPublicHolidayByGroup(groupId);
    if(deleteHols){
      return res.status(200).json("Public holiday(s) deleted.")
    }else{
      return res.status(400).json("Could not delete public holiday. Try again later.")
    }
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again. "+e.message)
  }

}

const  archivePublicHolidayByGroup = async (req, res) =>{
  try{
    const groupId = req.params.id;
    const pubHols = await PublicHoliday.getPublicHolidayByGroup(groupId);

    if(_.isNull(pubHols) || _.isEmpty(pubHols)){
      return res.status(400).json("Whoops! No record found.")
    }
    const deleteHols =  await PublicHoliday.archivePublicHolidayByGroup(groupId);
    if(deleteHols){
      return res.status(200).json("Public holiday(s) archived.")
    }else{
      return res.status(400).json("Could not archive public holiday. Try again later.")
    }
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again. "+e.message)
  }

}


module.exports = {
    setNewPublicHoliday,
    getAllPublicHolidays,
    getPublicHolidayById,
    fetchAllPublicHolidays,
    fetchPublicHolidayByYear,
    fetchSpecificPublicHoliday,
    updatePublicHoliday,
  getAllIndividualPublicHolidays,
  deletePublicHolidayByGroup,
  archivePublicHolidayByGroup,
  getCurrentYearPublicHolidays
}
