const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const EndYearResponse = require("../models/endofyearresponse")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addEndOfYearResponse(assessmentData) {
    return await EndYearResponse.create({
        eyr_master_id: assessmentData.eyr_master_id,
        eyr_goal: assessmentData.eyr_goal,
        eyr_reflection: assessmentData.eyr_reflection,
        eyr_type: assessmentData.eyr_type,
        eyr_emp_id: assessmentData.eyr_emp_id,
        eyr_gs_id: assessmentData.eyr_gs_id,
        eyr_strength : assessmentData.eyr_strength,
        eyr_growth_area: assessmentData.eyr_growth_area,
        eyr_response: assessmentData.eyr_response,
        eyr_status: assessmentData.eyr_status
    });
}

async function getEndOfYearResponse(eyrGsId, eyrEmpId) {
    return await EndYearResponse.findAll({where: {eyr_emp_id: eyrEmpId, eyr_gs_id: eyrGsId}})
}

async function removeResponse(empId, gsId) {
    return await EndYearResponse.destroy({where: {eyr_gs_id: gsId, eyr_emp_id: empId} })
}

async function approveEndYearResponseByMasterId(masterId) {
    return await EndYearResponse.update({
        eyr_status: 1
    }, {
        where: {eyr_master_id: masterId}
    })
}

async function rateEmployeeByMasterId(masterId, rating){
    return await EndYearResponse.update({
        eyr_rating: rating
    }, {
        where: {eyr_master_id: masterId}
    })
}



module.exports = {
    addEndOfYearResponse,
    getEndOfYearResponse,
    removeResponse,
    approveEndYearResponseByMasterId,
    rateEmployeeByMasterId

}
