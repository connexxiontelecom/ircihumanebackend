const Joi = require('joi');
const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const variationalDocumentModel = require("../models/variationaldocuments")(sequelize, Sequelize.DataTypes);
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}

async function setNewVariationalDocument(variationalData) {
    return await variationalDocumentModel.create({
        vd_emp_id: variationalData.vd_emp_id,
        vd_month: variationalData.vd_month,
        vd_year: variationalData.vd_year,
        vd_doc: variationalData.vd_doc,

    });


}

async function deletePaymentDocument(empid, month, year) {
    return await variationalDocumentModel.destroy({where: {vd_emp_id: empid, vd_month: month, vd_year: year}})
}


module.exports = {
    setNewVariationalDocument,
    deletePaymentDocument
}
