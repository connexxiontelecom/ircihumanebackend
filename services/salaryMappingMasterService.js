const {sequelize, Sequelize} = require('./db');
const SalaryMappingMaster = require("../models/salarymappingmaster")(sequelize, Sequelize.DataTypes)

async function addSalaryMappingMaster(salaryMappingMaster) {
    return await SalaryMappingMaster.create({
        smm_month: salaryMappingMaster.smm_month,
        smm_year: salaryMappingMaster.smm_year,
        smm_location: salaryMappingMaster.smm_location,
        smm_ref_code: salaryMappingMaster.smm_ref_code
    });
}

module.exports = {
    addSalaryMappingMaster
}
