const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const Pym = require("../models/payrollmonthyear")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addPayrollMonthYear(pym){


    return await Pym.create({
        pym_month: pym.pym_month,
        pym_year: pym.pym_year,
    });
}


async function updatePayrollMonthYear(pym, pym_id){

    return  await Pym.update({
        pym_month: pym.pym_month,
        pym_year: pym.pym_year,
    },{
        where:{
            pym_id:pym_id
        } })
}

async function findPayrollMonthYear(){
    return await Pym.findOne()
}

module.exports = {
   addPayrollMonthYear,
    updatePayrollMonthYear,
    findPayrollMonthYear

}
