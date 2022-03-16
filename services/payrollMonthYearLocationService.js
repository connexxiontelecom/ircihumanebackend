const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const Pmyl = require("../models/payrollmonthyearlocation")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addPayrollMonthYearLocation(pmyl) {


    return await Pmyl.create({
        pmyl_month: pmyl.pmyl_month,
        pmyl_year: pmyl.pmyl_year,
        pmyl_location_id: pmyl.pmyl_location_id
    });
}


async function updatePayrollMonthYearLocation(pmyl, pmyl_id) {

    return await Pmyl.update({
        pmyl_month: pmyl.pmyl_month,
        pmyl_year: pmyl.pmyl_year,
        pmyl_location_id: pmyl.pmyl_location_id
    }, {
        where: {
            pmyl_id: pmyl_id
        }
    })
}

async function findPayrollMonthYearLocation() {
    return await Pmyl.findOne()
}

async function findPayrollByMonthYearLocation(month, year, locationId) {
    return await Pmyl.findOne({where: {pmyl_month: month, pmyl_year: locationId}})
}

module.exports = {
    addPayrollMonthYearLocation,
    updatePayrollMonthYearLocation,
    findPayrollByMonthYearLocation,
    findPayrollMonthYearLocation

}
