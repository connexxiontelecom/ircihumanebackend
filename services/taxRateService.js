const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const TaxRate = require("../models/taxrate")(sequelize, Sequelize.DataTypes)


async function addTaxRate(taxRateData) {


    return await TaxRate.create({
        tr_band: taxRateData.tr_band,
        tr_rate: taxRateData.tr_rate,
    });
}


async function findAllTaxRate() {
    return await TaxRate.findAll({
        order: [
            ['tr_rate', 'ASC'],
        ]
    })
}

async function findTaxRateById(tr_id) {
    return await TaxRate.findOne({where: {tr_id: tr_id}})
}

async function updateTaxRate(taxRateData, tr_id) {

    return await TaxRate.update({
        tr_band: taxRateData.tr_band,
        tr_rate: taxRateData.tr_rate,
    }, {
        where: {
            tr_id: tr_id
        }
    })
}


module.exports = {
    addTaxRate,
    findAllTaxRate,
    findTaxRateById,
    updateTaxRate
}
