const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const variationalPaymentModel = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

const setNewVariationalPayment = async ( )=>{

    //const schema =

    /*try{
        await tmodel.create({
            travelapp_t2_travelapp_id: travelapp_id,
            travelapp_t2_id: t2_id,
        });
    }catch (e) {
        console.log(`Whoops: ${e.message}`);
    }*/

}

const getVariationalPayments = async ()=>{
    return await variationalPaymentModel.findAll();
}

const getVariationalPaymentById = async (id)=>{
    return await variationalPaymentModel.findOne({where:{vp_id: id}});
}

const updateVariationalPaymentStatus = async (id, status, user)=>{
    return await variationalPaymentModel.update({
        vp_confirm:status,
        vp_confirmed_by:user,
    },
        {where:{vp_id: id}});
}


module.exports = {
    setNewVariationalPayment,
    getVariationalPayments,
    getVariationalPaymentById,
    updateVariationalPaymentStatus,
}