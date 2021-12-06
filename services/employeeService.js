const { QueryTypes } = require('sequelize')

const { sequelize } = require('./db');
const helper  =require('../helper');


 async function getAllEmployee(){

     return await sequelize.query("SELECT * FROM `employee`");






}

module.exports = {
    getAllEmployee
}
