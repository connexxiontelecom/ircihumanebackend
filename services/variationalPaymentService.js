const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const variationalPaymentModel = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes);
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

 async function setNewVariationalPayment(variationalData){
       return  await variationalPaymentModel.create({
            vp_emp_id: variationalData.vp_emp_id,
            vp_payment_def_id: variationalData.vp_payment_def_id,
            vp_amount: variationalData.vp_amount,
            vp_payment_month: variationalData.vp_payment_month,
            vp_payment_year: variationalData.vp_payment_year
        });


}

const getVariationalPayments = async ()=>{
    return await variationalPaymentModel.findAll({
        include: ['employee']
    });
}

const getVariationalPaymentById = async (id)=>{
    return await variationalPaymentModel.findOne({where:{vp_id: id}, include: ['employee', 'payment']});
}

const updateVariationalPaymentStatus = async (id, status, user)=>{
    return await variationalPaymentModel.update({
        vp_confirm:status,
        vp_confirmed_by:user,
    },
        {where:{vp_id: id}});
}

async function getCurrentPayment(year, month){
    return await variationalPaymentModel.findAll({where:{vp_payment_month: month, vp_payment_year: year}, include: ['employee', 'payment']});

}

async function checkDuplicateEntry(empId, year, month, paymentType){
    return await variationalPaymentModel.findOne({ where:{ vp_payment_month: month, vp_payment_year: year, vp_emp_id: empId, vp_payment_def_id: paymentType}})
}

async function deletePaymentEntry(vpId){
    return await variationalPaymentModel.destroy({where:{ vp_id: vpId}})
}

const getUnconfirmedVariationalPayment = async ()=>{
    return await variationalPaymentModel.findAll({where:{vp_confirm:0}, include: ['employee', 'payment']})
}

async function getUnconfirmedVariationalPaymentMonthYear(month, year){
    return await variationalPaymentModel.findAll({where:{
        vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: 0
        }})
}

async  function getVariationalPaymentEmployeeMonthYear(empId, month, year){
    return await variationalPaymentModel.findAll({where:{
        vp_emp_id: empId,
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: 1
        }, include: ['payment']})
}

module.exports = {
    setNewVariationalPayment,
    getVariationalPayments,
    getVariationalPaymentById,
    updateVariationalPaymentStatus,
    getUnconfirmedVariationalPayment,
    getCurrentPayment,
    checkDuplicateEntry,
    deletePaymentEntry,
    getUnconfirmedVariationalPaymentMonthYear,
    getVariationalPaymentEmployeeMonthYear
}
