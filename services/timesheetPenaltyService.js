const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const _ = require('lodash')
const timesheetPenaltyModel = require("../models/TimeSheetPenalty")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addTimeSheetPenalty(data){
    return await timesheetPenaltyModel.create(data);
}

async function getTimeSheetPenalty(){
    return await timesheetPenaltyModel.findAll({
        attributes:['tsp_id', 'tsp_amount', 'tsp_emp_id', 'tsp_ref_no',
        'tsp_month', 'tsp_year', 'tsp_days_absent', 'tsp_status'],
        order:[['tsp_id', 'DESC']]
    });

}

async function filterTimeSheetPenalty(month, year){
    return await timesheetPenaltyModel.findAll({where:{tsp_month:month, tsp_year:year}, order:['tsp_id', 'DESC']});
}




module.exports = {
    addTimeSheetPenalty,
    getTimeSheetPenalty,
    filterTimeSheetPenalty
}
