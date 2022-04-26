const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const SelfAssessmentMaster = require("../models/selfassessmentmaster")(sequelize, Sequelize.DataTypes)


async function addSelfAssessmentMaster(selfAssessmentData) {
    return await SelfAssessmentMaster.create({
        sam_gs_id: selfAssessmentData.sam_gs_id,
        sam_emp_id: selfAssessmentData.sam_emp_id,
        sam_status: selfAssessmentData.sam_status,
        sam_supervisor_id: selfAssessmentData.sam_supervisor_id,
        sam_optional: selfAssessmentData.sam_optional
    });
}

async function removeSelfAssessmentMaster(gsId, empId) {
    return await SelfAssessmentMaster.destroy({where: {sam_gs_id: gsId, sam_emp_id: empId}})
}

async function findAssessmentMaster(gsId, empId) {
    return await SelfAssessmentMaster.findOne({where: {sam_gs_id: gsId, sam_emp_id: empId} })
}

async function approveSelfAssessmentMaster(empId, gsId, supervisorId) {
    return await SelfAssessmentMaster.update({
        sam_status: 1,
        sam_supervisor_id: supervisorId
    }, {
        where: {sam_gs_id: gsId, sam_emp_id: empId}
    })
}




module.exports = {
    addSelfAssessmentMaster,
    removeSelfAssessmentMaster,
    findAssessmentMaster,
    approveSelfAssessmentMaster
}
