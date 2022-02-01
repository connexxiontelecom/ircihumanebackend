const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const tmodel = require("../models/TravelApplicationBreakdown")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

const setNewTravelApplicationBreakdown = async (breakdown, travelapp_id )=>{
        try{
            await tmodel.create({
                ta_breakdown_travelapp_id: travelapp_id,
                ta_breakdown_from: breakdown.depart_from,
                ta_breakdown_date: breakdown.actual_date,
                ta_breakdown_mode: breakdown.means,
                ta_breakdown_prompt: breakdown.prompt,
                ta_breakdown_destination: breakdown.destination
            });
        }catch (e) {
            console.log(`Whoops: ${e.message}`);
        }

}

const getDetailsByTravelApplicationId = async (travelapp_id)=>{
    return await tmodel.findAll({where:{ta_breakdown_travelapp_id:travelapp_id}});
}

module.exports = {
    setNewTravelApplicationBreakdown,
    getDetailsByTravelApplicationId,
}