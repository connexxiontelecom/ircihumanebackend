const {sequelize, Sequelize} = require('./db');
const SalaryMappingDetails = require("../models/salarymappingdetails")(sequelize, Sequelize.DataTypes)

async function addSalaryMappingDetail(salaryMappingDetail) {
    return await SalaryMappingDetails.create({
        smd_master_id: salaryMappingDetail.smd_master_id,
        smd_ref_code: salaryMappingDetail.smd_ref_code,
        smd_employee_t7: salaryMappingDetail.smd_employee_t7,
        smd_donor_t1: salaryMappingDetail.smd_donor_t1,
        smd_salary_expense_t2s:salaryMappingDetail.smd_salary_expense_t2s,
        smd_benefit_expense_t2b: salaryMappingDetail.smd_benefit_expense_t2b,
        smd_allocation: salaryMappingDetail.smd_allocation,
        smd_status: salaryMappingDetail.smd_status,
    });
}

async function removeSalaryMappingDetails(masterId){
    return await SalaryMappingDetails.destroy({where:{
            smd_master_id: masterId
        }})
}

async function getSalaryMappingDetails(masterId){
    return await SalaryMappingDetails.findAll({where:{
            smd_master_id: masterId
        }})
}

async function getSalaryMappingDetailsByMasterEmployee(masterId, employee){
    return await SalaryMappingDetails.findAll({where:{
            smd_master_id: masterId,
            smd_employee_t7: employee
        }})
}

module.exports = {
    addSalaryMappingDetail,
    removeSalaryMappingDetails,
    getSalaryMappingDetails,
    getSalaryMappingDetailsByMasterEmployee
}
