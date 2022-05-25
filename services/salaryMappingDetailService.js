const {sequelize, Sequelize} = require('./db');
const SalaryMappingDetails = require("../models/salarymappingdetails")(sequelize, Sequelize.DataTypes)

async function addSalaryMappingDetail(salaryMappingDetail) {
    return await SalaryMappingDetails.create({
        smd_master_id: salaryMappingDetail.smd_master_id,
        smd_ref_code: salaryMappingDetail.smd_ref_code,
        smd_location_t7: salaryMappingDetail.smd_location_t7,
        smd_donor_t1: salaryMappingDetail.smd_donor_t1,
        smd_salary_expense_t2s:salaryMappingDetail.smd_salary_expense_t2s,
        smd_benefit_expense_t2b: salaryMappingDetail.smd_benefit_expense_t2b,
        smd_allocation: salaryMappingDetail.smd_allocation,
        smd_status: salaryMappingDetail.smd_status,
    });
}

module.exports = {
    addSalaryMappingDetail
}
