const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const tmodel = require("../models/TravelApplicationT2")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

async function setNewTravelApplicationT2 (travelapp_id, t2_id ){

    try{
        await tmodel.create({
            travelapp_t2_travelapp_id: travelapp_id,
            travelapp_t2_id: t2_id,
        });
    }catch (e) {
        console.log(`Whoops: ${e.message}`);
    }

}

const getT2DetailsByTravelApplicationId = async (travelapp_id)=>{
    return await tmodel.findAll({where:{travelapp_t2_travelapp_id:travelapp_id}});
}

module.exports = {
    setNewTravelApplicationT2,
    getT2DetailsByTravelApplicationId,
}