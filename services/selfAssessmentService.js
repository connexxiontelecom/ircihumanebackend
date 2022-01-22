const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const SelfAssessment = require("../models/selfassessment")(sequelize, Sequelize.DataTypes)




async function addSelfAssessment(selfAssessmentData){
    return await SelfAssessment.create({
        sa_gs_id: selfAssessmentData.sa_gs_id,
        sa_emp_id: selfAssessmentData.sa_emp_id,
        sa_comment: selfAssessmentData.sa_comment
     });
}

async function addSelfAssessmentEndYear(selfAssessmentData){
    return await SelfAssessment.create({
        sa_gs_id: selfAssessmentData.sa_gs_id,
        sa_emp_id: selfAssessmentData.sa_emp_id,
        sa_comment: selfAssessmentData.sa_comment,
        sa_eya_id: selfAssessmentData.sa_eya_id
    });
}


async  function findSelfAssessment(gsId, empId){
    return await SelfAssessment.findAll({ where: { sa_gs_id: gsId, sa_emp_id: empId }})

}

async function removeSelfAssessment(gsId, empId){
 return await SelfAssessment.destroy({where: { sa_gs_id: gsId, sa_emp_id: empId }})
}

async function findSelfAssessmentQuestions(empId, gsIdArray){
    return await SelfAssessment.findAll({ where: { sa_gs_id: gsIdArray, sa_emp_id: empId }})
}

async function respondSelfAssessment(saId, saResponse){
    return await SelfAssessment.update({
        sa_response: saResponse
    }, {
        where:{
            sa_id:saId
        } })
}

async function updateQuestion(eyaId, question){
    return await SelfAssessment.update({
        sa_comment:question
    },
        {
            where:{
                sa_eya_id: eyaId
            }
        })
}






module.exports = {
   addSelfAssessment,
    addSelfAssessmentEndYear,
   findSelfAssessment,
    removeSelfAssessment,
    findSelfAssessmentQuestions,
    respondSelfAssessment,
    updateQuestion
}
