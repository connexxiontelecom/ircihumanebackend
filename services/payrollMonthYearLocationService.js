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

async function findPayrollMonthYearLocationMonthYear(month, year) {
    return await Pmyl.findAll({where: {pmyl_month: month, pmyl_year: year}})
}

async function findPendingPayrollMonthYearLocationMonthYear(month, year) {
    return await Pmyl.findAll({where: {pmyl_month: month, pmyl_year: year, pmyl_confirmed: 0, pmyl_approved: 0}})
}

async function findConfirmedPayrollMonthYearLocationMonthYear(month, year) {
    return await Pmyl.findAll({where: {pmyl_month: month, pmyl_year: year, pmyl_confirmed: 1, pmyl_approved: 0}})
}

async function findApprovedPayrollMonthYearLocationMonthYear(month, year) {
    return await Pmyl.findAll({where: {pmyl_month: month, pmyl_year: year, pmyl_confirmed: 1, pmyl_approved: 1}})
}

async function findPayrollByMonthYearLocation(month, year, locationId) {
    return await Pmyl.findOne({where: {pmyl_month: month, pmyl_year: year, pmyl_location_id: locationId}})
}

async function removePayrollMonthYear(month, year) {
    return await Pmyl.destroy({where: {pmyl_month: month, pmyl_year: year}})
}

async function removePayrollMonthYearLocation(month, year, locationId) {
    return await Pmyl.destroy({where: {pmyl_month: month, pmyl_year: year, pmyl_location_id: locationId}})
}

async function findAllPending() {
    return await Pmyl.findAll({where: {pmyl_confirmed: 0}})
}

async function findAllConfirmed() {
    return await Pmyl.findAll({where: {pmyl_approved: 0}})
}


async function confirmPayrollMonthYearLocation(location, confirmBy, confirmDate, month, year) {

    return await Pmyl.update({
        pmyl_confirmed: 1,
        pmyl_confirmed_by: confirmBy,
        pmyl_confirmed_date: confirmDate
    }, {
        where: {
            pmyl_location_id: location,
            pmyl_month: month,
            pmyl_year: year

        }
    })
}


async function unconfirmPayrollMonthYearLocation(location, confirmBy, confirmDate, month, year) {

    return await Pmyl.update({
        pmyl_confirmed: 0,
        pmyl_confirmed_by: confirmBy,
        pmyl_confirmed_date: confirmDate
    }, {
        where: {
            pmyl_location_id: location,
            pmyl_month: month,
            pmyl_year: year

        }
    })
}

async function approvePayrollMonthYearLocation(location, approveBy, approveDate, month, year) {

    return await Pmyl.update({
        pmyl_approved: 1,
        pmyl_approved_by: approveBy,
        pmyl_approved_date: approveDate
    }, {
        where: {
            pmyl_location_id: location,
            pmyl_month: month,
            pmyl_year: year
        }
    })
}

async function findApprovedPayrollByMonthYearLocation(month, year, locationId) {
    return await Pmyl.findOne({where: {pmyl_month: month, pmyl_year: year, pmyl_location_id: locationId, pmyl_approved: 1,}})
}

module.exports = {
    addPayrollMonthYearLocation,
    updatePayrollMonthYearLocation,
    findPayrollByMonthYearLocation,
    findPayrollMonthYearLocation,
    removePayrollMonthYear,
    removePayrollMonthYearLocation,
    findPayrollMonthYearLocationMonthYear,
    confirmPayrollMonthYearLocation,
    unconfirmPayrollMonthYearLocation,
    approvePayrollMonthYearLocation,
    findPendingPayrollMonthYearLocationMonthYear,
    findConfirmedPayrollMonthYearLocationMonthYear,
    findAllConfirmed,
    findAllPending,
    findApprovedPayrollMonthYearLocationMonthYear,
    findApprovedPayrollByMonthYearLocation

}
