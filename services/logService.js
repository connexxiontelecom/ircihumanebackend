const { QueryTypes } = require('sequelize')
const Joi = require('joi')
const bcrypt = require("bcrypt");
const { sequelize, Sequelize } = require('./db');
const Log = require("../models/log")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');

async function findAllLogs(){
    return await Log.findAll()
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

 async function updateUser(user, user_id){
     if(user.user_password){
         const salt = await bcrypt.genSalt(10);
         user.user_password = await bcrypt.hash(user.user_password, salt);
     }

  return  await User.update({
                user_username: user.user_username,
                user_name: user.user_name,
                user_email: user.user_email,
                user_password: user.user_password,
                user_type: user.user_type,
                user_token: user.user_token,
                user_status: user.user_status,
            },{
                where:{
                    user_id:user_id
                } });
}



module.exports = {
   addLog,
   findAllLogs,
    }
