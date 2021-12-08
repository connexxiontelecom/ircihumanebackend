const { QueryTypes } = require('sequelize')

const { sequelize, Sequelize } = require('./db');
const test = require("../models/test")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');


 async function getAllEmployee(){

     return await test.findAll();
}

async function getOneEmployee(employee_id){
     return await test.findOne({
         'test_id': employee_id
     })
}
module.exports = {
    getAllEmployee,
    getOneEmployee
}
