const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const GoalSetting = require("../models/goalsetting")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addGoalSetting(goalSettingData){
    return await GoalSetting.create({
        gs_from: goalSettingData.gs_from,
        gs_to: goalSettingData.gs_to,
        gs_year: goalSettingData.gs_year,
        gs_status: goalSettingData.gs_status,
        gs_activity:goalSettingData.gs_activity,

     });
}

async function updateGoalSetting(gsId, goalSettingData){
    return await GoalSetting.update({
        gs_from: goalSettingData.gs_from,
        gs_to: goalSettingData.gs_to,
        gs_year: goalSettingData.gs_year,
        gs_status: goalSettingData.gs_status,


    }, {
            where:{
                gs_id:gsId
            }
        });
}

async function closeGoalSetting(gsId){
    return await GoalSetting.update({
             gs_status: 0,
    }, {
        where:{
            gs_id:gsId
        }
    });
}

async function findGoalSetting(gsActivity, year){
    return await GoalSetting.findOne({  where: { gs_activity: gsActivity, gs_year: year } })

}

async function findActiveGoal(year){
    return await GoalSetting.findAll({  where: { gs_status: 1, gs_year: year } })

}

async function closeAllGoals(){
    return await GoalSetting.update({
        gs_status: 0,
     }, {
        where:{
            gs_status: 1
        }
    });
}

async function findGoals(){
    return await GoalSetting.findAll({   order: [
            ['gs_year', 'DESC'],
            ['gs_id', 'ASC'],
        ] })

}





module.exports = {
    addGoalSetting,
    updateGoalSetting,
    findGoalSetting,
    findActiveGoal,
    findGoals,
    closeAllGoals,
    closeGoalSetting
    }
