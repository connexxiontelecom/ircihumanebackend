const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const Salary = require("../models/salary")(sequelize, Sequelize.DataTypes);
const PaymentDefinition = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes);
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const VariationalPayment = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');

async function addSalary(salary){


    return await salary.create({

    });
}

module.exports = {

}
