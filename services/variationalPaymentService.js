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

const setNewVariationalPayment = async ( variationalData )=>{

    try{
        await variationalPaymentModel.create({
            vp_emp_id: variationalData.employee,
            vp_payment_def_id: variationalData.payment_definition,
            vp_amount: variationalData.amount,
            vp_payment_month: variationalData.month,
            vp_payment_year: variationalData.year
        });
    }catch (e) {
        //console.log(`Whoops: ${e.message}`);
    }

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



const getUnconfirmedVariationalPayment = async ()=>{
    return await variationalPaymentModel.findAll({where:{vp_confirm:0}})
}

module.exports = {
    setNewVariationalPayment,
    getVariationalPayments,
    getVariationalPaymentById,
    updateVariationalPaymentStatus,
    getUnconfirmedVariationalPayment,
}