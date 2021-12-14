const { QueryTypes } = require('sequelize')


const { sequelize, Sequelize } = require('./db');
const MinimumTaxRate = require("../models/minimumtaxrate")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addMinimumTaxRate(minimumTaxRateData){


    return await MinimumTaxRate.create({
        mtr_rate: minimumTaxRateData.mtr_rate,
       });
}


async function findAllMinimumTaxRate(){
    return await MinimumTaxRate.findAll()
}

async function findMinimumTaxRateById(mtr_id){
    return await MinimumTaxRate.findOne({ where: { mtr_id: mtr_id } })
}

async function updateMinimumTaxRate(minimumTaxRateData, mtr_id){

    return  await MinimumTaxRate.update({
        mtr_rate: minimumTaxRateData.mtr_rate,
    },{
        where:{
            mtr_id:mtr_id
        } })
}


module.exports = {
    addMinimumTaxRate,
    findAllMinimumTaxRate,
    findMinimumTaxRateById,
    updateMinimumTaxRate
   }
