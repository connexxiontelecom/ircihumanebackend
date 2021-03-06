const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db')
const PayrollJournal = require("../models/payrolljournal")(sequelize, Sequelize.DataTypes)

const Joi = require('joi');

async function getAllPayrollJournal() {
    return await PayrollJournal.findAll({include: ['location']});
}

async function getPayrollJournal(pjId) {
    return await PayrollJournal.findOne({where:{
            pj_id: pjId
        }});
}
async function getPayrollJournalByJournalItem(pjItem) {
    return await PayrollJournal.findOne({where:{
            pj_journal_item: pjItem
        }});
}

async function getPayrollJournalByJournalItemLocation(pjItem, location) {
    return await PayrollJournal.findOne({where:{
            pj_journal_item: pjItem,
            pj_location: location
        }});
}

async function addPayrollJournal(payrollJournal) {
    let pjJournalItem = String(payrollJournal.pj_journal_item)
    pjJournalItem = pjJournalItem.toUpperCase()
    return await PayrollJournal.create({
        pj_code: payrollJournal.pj_code,
        pj_journal_item: pjJournalItem,
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
    getAllPayrollJournal,
    getPayrollJournal,
    getPayrollJournalByJournalItem,
    getPayrollJournalByJournalItemLocation
}
