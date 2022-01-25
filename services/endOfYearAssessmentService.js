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

async function getEndOfYearAssessmentQuestions(){
    return await EndYearAssessment.findAll( {order: [
        ['eya_year', 'DESC'],
        ['eya_id', 'ASC'],
    ] })
}

async function getEndOfYearAssessmentQuestionByGoal(eyGsId){
    return await EndYearAssessment.findAll({ where:{ eya_gs_id: eyGsId }})
}

async function getEndOfYearAssessmentQuestion(eyaId){
    return await EndYearAssessment.findOne({ where:{ eya_id: eyaId }})
}

async function removeAssessment(gsId){
    return await EndYearAssessment.destroy({where: { eya_gs_id: gsId }})
}

async function updateQuestion(eyaId, eyaQuestion){

    return await EndYearAssessment.update({
        eya_question: eyaQuestion
    }, {
        where:{
            eya_id: eyaId
        }

    })
}




module.exports = {
    addEndOfYearAssessment,
    getEndOfYearAssessmentQuestionByGoal,
    removeAssessment,
    updateQuestion,
    getEndOfYearAssessmentQuestion,
    getEndOfYearAssessmentQuestions


}
