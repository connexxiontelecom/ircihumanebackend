const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const _ = require('lodash')
const timesheetPenalty = require("../models/TimeSheetPenalty")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addTimeSheetPenalty(data){
    return await timesheetPenalty.create({
        tsp_emp_id: data.emp_id,
        tsp_month: data.month,
        tsp_year: data.year,
        tsp_days_absent: data.days_absent,
        tsp_amount: data.amount,
    });
}




module.exports = {
    addTimeSheetPenalty,
}
