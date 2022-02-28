const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const _ = require('lodash')
const timesheetPenalty = require("../models/TimeSheetPenalty")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addTimeSheetPenalty(data){
    return await timesheetPenalty.create(data);
}




module.exports = {
    addTimeSheetPenalty,
}
