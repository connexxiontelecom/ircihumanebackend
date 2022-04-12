const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const User = require("../models/user")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');
const logs = require('../services/logService');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const helper = require('../helper');
const auth = require("../middleware/auth");

async function findAllUsers() {
    return await User.findAll()
}

async function addUser(user) {
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

async function updateUser(user, user_id) {
    if (user.user_password) {
        const salt = await bcrypt.genSalt(10);
        user.user_password = await bcrypt.hash(user.user_password, salt);
    }

    return await User.update({
        user_username: user.user_username,
        user_name: user.user_name,
        user_email: user.user_email,
        user_password: user.user_password,
        user_type: user.user_type,
        user_token: user.user_token,
        user_status: user.user_status,
    }, {
        where: {
            user_id: user_id
        }
    });
}

async function findUserByEmail(email) {
    return await User.findOne({where: {user_email: email}})
}

async function findUserByUsername(username) {
    return await User.findOne({where: {user_username: username}})
}

async function suspendUser(username) {
    return await User.update({user_status: 0}, {where: {user_username: username}})
}

async function unSuspendUser(username) {
    return await User.update({user_status: 1}, {where: {user_username: username}})
}

async function findUserByUserId(userId) {
    return await User.findOne({where: {user_id: userId}})
}

async function changePassword(req, res, next) {
    try {
        const schema = Joi.object({
            current_password: Joi.string().required(),
            new_password: Joi.string().required(),
            retype_password: Joi.string().required(),
        });

        const passwordRequest = req.body
        const validationResult = schema.validate(passwordRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const salt = await bcrypt.genSalt(10);
        let user_id = req.user.username.user_id;
        let user = await User.findOne({where: {user_id: user_id}}); // findUserByUserId(user_id)

        bcrypt.compare(req.body.current_password, user.user_password, function (err, response) {
            if (err) {
                return res.status(400).json({'message': 'An error occured. Try again.'});
            }

            if (response) {
                if (req.body.new_password === req.body.retype_password) {
                    /* let hashed_password = '';
                     bcrypt.hash(req.body.new_password, salt, (er, hash)=>{
                         console.log(hash);
                         return res.status(200).json({'hashed': hash});
                     });*/
                    //return res.status(200).json({'hashed': hashed_password});
                    const user_id = req.user.username.user_id;
                    User.update({
                        user_password: req.body.new_password,
                    }, {
                        where: {
                            user_id: user_id
                        }
                    });
                    //Log
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": `Log on user: Password change`,
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {
                        return res.status(200).json(`Password change :  Your password was changed successfully.`);
                    });
                } else {
                    return res.status(400).json({'message': "New password & re-type password mismatch. Try again."});
                }
            } else {
                return res.status(400).json({'message': 'Current password mismatch. Try again.'});
            }
        });
        /*if( req.body.current_password === user.password){
            if(req.body.new_password === req.body.retype_password){
                const user_id = req.user.username.user_id;
                await User.update({
                    user_password: await bcrypt.hash(req.body.new_password,salt),
                },{
                    where:{
                        user_id:user_id
                    }
                });
                //Log
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": `Log on user: Password change`,
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{
                    return res.status(200).json(`Password change :  Your password was changed successfully.`);
                });
            }else{
                return res.status(400).json({'message':"New password & re-type password mismatch. Try again."});
            }
        }else{
            return res.status(400).json({'message':"Current password mismatch. Try again."});
        }*/
    } catch (e) {
        console.error(`Error occured while attempting to change password `, e.message);
        next(e);
    }
}


module.exports = {
    addUser,
    findUserByEmail,
    findUserByUsername,
    findUserByUserId,
    updateUser,
    findAllUsers,
    changePassword,
    suspendUser,
    unSuspendUser
}
