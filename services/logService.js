const { QueryTypes } = require('sequelize')
const Joi = require('joi')

const { sequelize, Sequelize } = require('./db');
const Log = require("../models/log")(sequelize, Sequelize.DataTypes)
const User = require("../models/user")(sequelize, Sequelize.DataTypes)



const helper  = require('../helper');

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


}


module.exports = {
   addLog,
   findAllLogs,
    }
