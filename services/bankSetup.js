const { QueryTypes } = require('sequelize')

const { sequelize, Sequelize } = require('./db');
const bank = require("../models/Bank")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');


async function getBanks(){
    return await bank.findAll();
}

module.exports = {
    getBanks,
}