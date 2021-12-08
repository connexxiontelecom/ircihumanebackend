const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const users = require('../services/userService');



/* Add User */
router.post('/add-user', auth,  async function(req, res, next) {
    try {

    const user = req.body
    await users.findUserByEmail(user.user_email).then((data) =>{
            if(data){

               return res.status(403).json('Email Already taken')

            }else{
                 users.findUserByUsername(user.user_username).then((data) =>{
                    if(data){

                        return res.status(403).json('Username Already taken')

                    }else{
                        users.addUser(user).then((data)=>{

                           return  res.status(200).json(data)
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
router.patch('/update-user', auth,  async function(req, res, next) {
    try {

        const user = req.body
        await users.findUserByUserId(user.user_id).then((data) =>{
            if(data){



                return res.status(403).json('Email Already taken')

            }else{

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
                 bcrypt.compare(user.user_password, data.user_password,  function(err, response){
                     if(err){
                        return res.status(403).json(`${err} occurred while logging in`)
                     }
                     if(response){
                         let token = generateAccessToken(data)
                         return res.status(200).json(token);
                     }else{
                         return res.status(403).json('Incorrect Password')
                     }
                 })
            }
            else{
              return res.status(404).json('Invalid Username')
            }
        })
    } catch (err) {
        return res.status(403).json(`Error while logging user ${err.message}`)
    }
});

function generateAccessToken(username) {
    return jwt.sign({username},  process.env.TOKEN_SECRET, { expiresIn: '18000s' });
}


module.exports = router;
