const Joi = require('joi')
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const users = require('../services/userService');
const logs = require("../services/logService");


/* Get All Users */
router.get('/', auth, async function(req, res, next) {
    try {

        await users.findAllUsers().then((data) =>{
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while fetching users ${err.message}`)
    }
});


/* Add User */
router.post('/add-user', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_password: Joi.string().min(5).required(),
            user_password_repeat: Joi.ref('user_password'),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
        })

        const user = req.body
        const validationResult = schema.validate(user)

        if(validationResult.error){
          return res.status(400).json(validationResult.error.details[0].message)
        }
        delete user.user_password_repeat;
        await users.findUserByEmail(user.user_email).then((data) =>{
            if(data){

               return res.status(400).json('Email Already taken')

            }else{
                 users.findUserByUsername(user.user_username).then((data) =>{
                    if(data){

                        return res.status(400).json('Username Already taken')

                    }else{
                        users.addUser(user).then((data)=>{
                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Added new user",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes)=>{
                                //return res.status(200).json(logRes);
                                return  res.status(200).json(data)
                            })

                          // return  res.status(200).json(data)
                        })
                    }
                })
            }
        })
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

/* UpdateUser */
router.patch('/update-user/:user_id', auth,  async function(req, res, next) {
    try {

        const schemaWithoutPassword = Joi.object( {
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
        })

        const schemaWithPassword = Joi.object( {
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_password: Joi.string().min(5).required(),
            user_password_repeat: Joi.ref('user_password'),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
        })

        const user = req.body

            let validationResult;
            if(user.user_password){
               validationResult = schemaWithPassword.validate(user)
            }else{
                validationResult = schemaWithoutPassword.validate(user)
            }

           if(validationResult.error){
                return res.status(400).json(validationResult.error.details[0].message)
            }


            await users.findUserByUserId(req.params['user_id']).then((data) =>{
                if(data){
                    users.updateUser(user, req.params['user_id']).then((data)=>{
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added new user",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes)=>{
                            //return res.status(200).json(logRes);
                            return res.status(200).json(`User updated`)
                        })

                    })


                }else{
                    return res.status(404).json('User does not exist in database')
                }
            })
    } catch (err) {

        console.error(`Error while updating user `, err.message);
        next(err);
    }
});

/* Login User */
router.post('/login', async function(req, res, next) {
    try {
        const user = req.body
        await users.findUserByUsername(user.user_username).then((data) =>{
            if(data){
                if(parseInt(data.user_status) === 1){
                    bcrypt.compare(user.user_password, data.user_password,  function(err, response){
                        if(err){
                            return res.status(400).json(`${err} occurred while logging in`)
                        }
                        if(response){
                            delete data.user_password;
                            let token = generateAccessToken(data)

                            const logData = {
                                "log_user_id": data.user_id,
                                "log_description": "logged in",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes)=>{
                                data.user_password = null;
                                const responseData = {
                                    "token" : token,
                                    "userData": data


                                }
                                return res.status(200).json(responseData);


                            })

                        }else{
                            return res.status(400).json('Incorrect Password')
                        }
                    })
                }else{
                    return res.status(400).json('User Account Suspended')
                }

            }
            else{
              return res.status(404).json('Invalid Username')
            }
        })
    } catch (err) {
        return res.status(400).json(`Error while logging user ${err.message}`)
    }
});

function generateAccessToken(username) {
    return jwt.sign({username},  process.env.TOKEN_SECRET, { expiresIn: '18000s' });
}

router.post('/change-password', auth, users.changePassword);


module.exports = router;
