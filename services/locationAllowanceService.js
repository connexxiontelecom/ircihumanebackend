const { QueryTypes } = require('sequelize')


const { sequelize, Sequelize } = require('./db');
const LocationAllowance = require("../models/locationallowance")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addLocationAllowance(locationAllowanceData){


    return await LocationAllowance.create({
        la_payment_id: locationAllowanceData.la_payment_id,
        la_location_id: locationAllowanceData.la_location_id,
        la_amount: locationAllowanceData.la_amount
    });
}


async function findAllLocationAllowances(){
    return await LocationAllowance.findAll()
}

async function findLocationAllowanceById(la_id){
    return await LocationAllowance.findOne({ where: { la_id: la_id } })
}

async function updateLocationAllowance(locationAllowanceData, la_id){

    return  await LocationAllowance.update({
        la_payment_id: locationAllowanceData.la_payment_id,
        la_location_id: locationAllowanceData.la_location_id,
        la_amount: locationAllowanceData.la_amount
    },{
        where:{
            la_id:la_id
        } })
}

async function findLocationAllowanceByPaymentIdLocationId(payment_id, location_id){
    return await LocationAllowance.findOne({ where: { la_payment_id: payment_id, la_location_id: location_id } })
}


module.exports = {
    addLocationAllowance,
    findAllLocationAllowances,
    findLocationAllowanceById,
    updateLocationAllowance,
    findLocationAllowanceByPaymentIdLocationId
   }
