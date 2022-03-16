const Joi = require('joi');
const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const variationalPaymentModel = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes);
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}

async function setNewVariationalPayment(variationalData) {
    return await variationalPaymentModel.create({
        vp_emp_id: variationalData.vp_emp_id,
        vp_payment_def_id: variationalData.vp_payment_def_id,
        vp_amount: variationalData.vp_amount,
        vp_payment_month: variationalData.vp_payment_month,
        vp_payment_year: variationalData.vp_payment_year
    });


}

async function setNewSingleVariationalPayment(variationalData) {
    return await variationalPaymentModel.create(variationalData);
}

const getVariationalPayments = async () => {
    return await variationalPaymentModel.findAll({
        include: ['employee']
    });
}

const getVariationalPaymentById = async (id) => {
    return await variationalPaymentModel.findOne({where: {vp_id: id}, include: ['employee', 'payment']});
}

const updateVariationalPaymentStatus = async (id, status, user) => {
    return await variationalPaymentModel.update({
            vp_confirm: status,
            vp_confirmed_by: user,
        },
        {where: {vp_id: id}});
}

async function updateAmount(id, amount) {
    return await variationalPaymentModel.update({
        vp_confirm: 0,
        vp_amount: amount
    }, {where: {vp_id: id}})
}

async function getCurrentPayment(year, month) {
    return await variationalPaymentModel.findAll({
        where: {vp_payment_month: month, vp_payment_year: year},
        include: ['employee', 'payment']
    });

}

async function getCurrentPendingPayment(year, month) {
    return await variationalPaymentModel.findAll({
        where: {
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: 0
        }, include: ['employee', 'payment']
    });

}

async function checkDuplicateEntry(empId, year, month, paymentType) {
    return await variationalPaymentModel.findOne({
        where: {
            vp_payment_month: month,
            vp_payment_year: year,
            vp_emp_id: empId,
            vp_payment_def_id: paymentType
        }, include: ['employee', 'payment']
    })
}

async function deletePaymentEntry(vpId) {
    return await variationalPaymentModel.destroy({where: {vp_id: vpId}})
}

async function findPayment(vpId) {
    return await variationalPaymentModel.findOne({where: {vp_id: vpId}})
}

const getUnconfirmedVariationalPayment = async () => {
    return await variationalPaymentModel.findAll({where: {vp_confirm: 0}, include: ['employee', 'payment']})
}

async function getUnconfirmedVariationalPaymentMonthYear(month, year) {
    return await variationalPaymentModel.findAll({
        where: {
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: [0, 3]
        }
    })
}

async function getUnconfirmedVariationalPaymentMonthYearEmployees(month, year, employees) {
    return await variationalPaymentModel.findAll({
        where: {
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: [0, 3],
            vp_emp_id: employees
        }
    })
}



async function getVariationalPaymentEmployeeMonthYear(empId, month, year) {
    return await variationalPaymentModel.findAll({
        where: {
            vp_emp_id: empId,
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: 1
        }, include: ['payment']
    })
}

async function undoVariationalPaymentMonthYear(month, year) {

    return await variationalPaymentModel.update({
        vp_confirm: 0
    }, {
        where: {
            vp_payment_month: month,
            vp_payment_year: year,
            vp_confirm: [1, 3, 0]
        }
    })

}


async function getVariationalPaymentMonthYear(month, year, employee, payment_type) {

    return await variationalPaymentModel.findOne(
        {
            where: {
                vp_payment_month: month,
                vp_payment_year: year,
                vp_emp_id: employee,
                vp_payment_def_id: payment_type,
                vp_confirm: [0, 1, 3]
            }
        })

}


module.exports = {
    setNewVariationalPayment,
    getVariationalPayments,
    getVariationalPaymentById,
    updateVariationalPaymentStatus,
    getUnconfirmedVariationalPayment,
    getCurrentPayment,
    checkDuplicateEntry,
    deletePaymentEntry,
    getUnconfirmedVariationalPaymentMonthYear,
    getVariationalPaymentEmployeeMonthYear,
    findPayment,
    updateAmount,
    getCurrentPendingPayment,
    undoVariationalPaymentMonthYear,
    setNewSingleVariationalPayment,
    getVariationalPaymentMonthYear,
    getUnconfirmedVariationalPaymentMonthYearEmployees
}
