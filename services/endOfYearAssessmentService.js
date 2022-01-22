const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const EndYearAssessment = require("../models/endofyearassessment")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addEndOfYearAssessment(assessmentData){
    return await EndYearAssessment.create({
        eya_gs_id: assessmentData.eya_gs_id,
        eya_year: assessmentData.eya_year,
        eya_question: assessmentData.eya_question,
     });
}

async function getEndOfYearAssessmentQuestionByGoal(eyGsId){
    return await EndYearAssessment.findAll({ where:{ eya_gs_id: eyGsId }})
}

async function removeAssessment(gsId){
    return await EndYearAssessment.destroy({where: { eya_gs_id: gsId }})
}




module.exports = {
    addEndOfYearAssessment,
    getEndOfYearAssessmentQuestionByGoal,
    removeAssessment


}
