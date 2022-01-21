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


async  function findSelfAssessment(gsId, empId){
    return await SelfAssessment.findAll({ where: { sa_gs_id: gsId, sa_emp_id: empId }})

}

async function removeSelfAssessment(gsId, empId){
 return await SelfAssessment.destroy({where: { sa_gs_id: gsId, sa_emp_id: empId }})
}





module.exports = {
   addSelfAssessment,
   findSelfAssessment,
    removeSelfAssessment
}
