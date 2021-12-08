const { QueryTypes } = require('sequelize')

const bcrypt = require("bcrypt");
const { sequelize, Sequelize } = require('./db');
const User = require("../models/user")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


 async function addUser(user){





    const salt = await bcrypt.genSalt(10);
    user.user_password = await bcrypt.hash(user.user_password, salt);


    return await User.create({
        user_username: user.user_username,
        user_name: user.user_name,
        user_email: user.user_email,
        user_password: user.user_password,
        user_type: user.user_type,
        user_token: user.user_token,
        user_status: user.user_status,
    });
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

 async function findUserByEmail(email){
    return await User.findOne({ where: { user_email: email } })
}

 async function findUserByUsername(username){
    return await User.findOne({ where: { user_username: username } })
}

 async function findUserByUserId(userId){
    return await User.findOne({ where: { user_id: userId } })
}


module.exports = {
   addUser,
   findUserByEmail,
   findUserByUsername,
   findUserByUserId,
    updateUser
    }
