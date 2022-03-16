const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const GoalSettingYear = require("../models/goalsettingyear")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addGoalSettingYear(goalSettingYearData) {
    return await GoalSettingYear.create({
        gsy_year: goalSettingYearData.gsy_year

    });
}


async function getGoalSettingYear() {
    return await GoalSettingYear.findOne();
}


async function removeGoalSettingYear() {
    return await GoalSettingYear.destroy({
        where: {},
        truncate: true
    })
}


module.exports = {
    addGoalSettingYear,
    getGoalSettingYear,
    removeGoalSettingYear

}
