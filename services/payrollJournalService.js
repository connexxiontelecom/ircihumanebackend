const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db')
const PayrollJournal = require("../models/payrolljournal")(sequelize, Sequelize.DataTypes)

const Joi = require('joi');

async function getAllPayrollJournal() {
    return await PayrollJournal.findAll();
}

async function addPayrollJournal(payrollJournal) {
    return await PayrollJournal.create({
        pj_code: payrollJournal.pj_code,
        pj_journal_item: payrollJournal.pj_journal_item,
        pj_location: payrollJournal.pj_location,
        pj_setup_by: payrollJournal.pj_setup_by,
    });
}

async function updatePayrollJournal(payrollJournal) {
    return await PayrollJournal.update(
        {
            pj_code: payrollJournal.pj_code,
            pj_journal_item: payrollJournal.pj_journal_item,
            pj_location: payrollJournal.pj_location,
            pj_setup_by: payrollJournal.pj_setup_by,
        },
        {
            where: {
                pj_id: payrollJournal.pj_id,
            },
        }
    )
}

async function deletePayrollJournal(pjId) {
    return await PayrollJournal.destroy({
        where: {
            pj_id: pjId
        }
    })
}


module.exports = {
    addPayrollJournal,
    updatePayrollJournal,
    deletePayrollJournal,
    getAllPayrollJournal
}
