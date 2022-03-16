const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const GoalSettingLog = require("../models/goalsettinglogs")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addGoalSettingLog(goalSettingLogData) {
    return await GoalSettingLog.create({
        gsl_activity: goalSettingLogData.gsl_activity,
        gsl_year: goalSettingLogData.gsl_year,
        gsl_status: goalSettingLogData.gsl_status

    });
}

async function getGoalSettingLog(year, activity) {
    return await GoalSettingLog.findAll({
        where: {
            gsl_year: year,
            gsl_activity: activity
        }
    })
}


module.exports = {
    addGoalSettingLog,
    getGoalSettingLog
}
