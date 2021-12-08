const { QueryTypes } = require('sequelize')

const bcrypt = require("bcrypt");
const { sequelize, Sequelize } = require('./db');
const Pd = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addPaymentDefinition(pd){


    return await Pd.create({
        pd_payment_code: pd.pd_payment_code,
        pd_payment_name: pd.pd_payment_name,
        pd_payment_type: pd.pd_payment_type,
        pd_payment_variant: pd.pd_payment_variant,
        pd_payment_taxable: pd.pd_payment_taxable,
        pd_desc: pd.pd_desc,
        pd_basic: pd.pd_basic,
        pd_tie_number: pd.pd_tie_number,
    });
}

async function findPaymentByCode(code){
    return await Pd.findOne({ where: { pd_payment_code: code } })
}

async function findPaymentById(id){
    return await Pd.findOne({ where: { pd_id: id } })
}

async function updatePaymentDefinition(pd, pd_id){

    return  await Pd.update({
        pd_payment_code: pd.pd_payment_code,
        pd_payment_name: pd.pd_payment_name,
        pd_payment_type: pd.pd_payment_type,
        pd_payment_variant: pd.pd_payment_variant,
        pd_payment_taxable: pd.pd_payment_taxable,
        pd_desc: pd.pd_desc,
        pd_basic: pd.pd_basic,
        pd_tie_number: pd.pd_tie_number,
    },{
        where:{
            pd_id:pd_id
        } })
}

async function findAllCodes(){
    return await Pd.findAll()
}

module.exports = {
    addPaymentDefinition,
    findPaymentByCode,
    findPaymentById,
    findAllCodes,
    updatePaymentDefinition
    // findUserByEmail,
    // findUserByUsername,
    // findUserByUserId,
    // updateUser
}
