const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const SelfAssessmentMaster = require("../models/selfassessment")(sequelize, Sequelize.DataTypes)


async function addSelfAssessmentMaster(selfAssessmentData) {
    return await SelfAssessmentMaster.create({
        sam_gs_id: selfAssessmentData.sam_gs_id,
        sam_emp_id: selfAssessmentData.sam_emp_id,
        sam_status: selfAssessmentData.sam_status,
    });
}

async function removeSelfAssessmentMaster(gsId, empId) {
    return await SelfAssessmentMaster.destroy({where: {sam_gs_id: gsId, sam_emp_id: empId}})
}

async function findAssessmentMaster(gsId, empId) {
    return await SelfAssessmentMaster.findOne({where: {sam_gs_id: gsId, sam_emp_id: empId}})
}




module.exports = {
    addSelfAssessmentMaster,
    removeSelfAssessmentMaster,
    findAssessmentMaster
}
