const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const GrantChart = require("../models/grantchart")(sequelize, Sequelize.DataTypes)
const Location = require("../models/Location")(sequelize, Sequelize.DataTypes)
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes)
const Donor = require("../models/donor")(sequelize, Sequelize.DataTypes)
const helper  = require('../helper');


async function addGrantChart(grantChartData){


    return await GrantChart.create({
        gc_location_id: grantChartData.gc_location_id,
        gc_department_id: grantChartData.gc_department_id,
        gc_expense: grantChartData.gc_expense,
        gc_account_code: grantChartData.gc_account_code,
        gc_description: grantChartData.gc_description,
        gc_amount: grantChartData.gc_amount,
        gc_donor_id: grantChartData.gc_donor_id
    });
}

async function findGrantChartByCode(code){
    return await GrantChart.findOne({ where: { gc_account_code: code } })
}

async function findGrantChartById(id){
    return await GrantChart.findOne({ where: { gc_id: id } })
}

async function updateGrantChart(grantChartData, gc_id){

    return  await GrantChart.update({
        gc_location_id: grantChartData.gc_location_id,
        gc_department_id: grantChartData.gc_department_id,
        gc_expense: grantChartData.gc_expense,
        gc_account_code: grantChartData.gc_account_code,
        gc_description: grantChartData.gc_description,
        gc_amount: grantChartData.gc_amount,
        gc_donor_id: grantChartData.gc_donor_id,
    },{
        where:{
            gc_id:gc_id
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

}
