const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

const registerNewAction = async (auth_type, travel_app, officer, status, comment)=>  {
    try{
        await authorizationModel.create({
            auth_officer_id: officer,
            auth_status: status,
            auth_comment: comment,
            auth_type: auth_type,
            auth_travelapp_id:travel_app
        });
    }catch (e) {
        console.log(`Whoops: ${e.message}`);
    }

}


module.exports = {
    registerNewAction,
}
