const Joi = require('joi');
const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const employeeDocumentsModel = require("../models/employeedocuments")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}

async function addEmployeeDocument (documentData) {
    return await employeeDocumentsModel.create({
        ed_empid: documentData.ed_empid,
        ed_doc: documentData.ed_doc,
    });
}


async function deleteEmployeeDocument(ed_doc) {
    return await employeeDocumentsModel.destroy({where: {ed_doc: ed_doc}})
}


module.exports = {
    addEmployeeDocument,
    deleteEmployeeDocument
}
