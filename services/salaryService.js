const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const Salary = require("../models/salary")(sequelize, Sequelize.DataTypes);
const PaymentDefinition = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes);
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const VariationalPayment = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');

async function addSalary(salary){
    return await Salary.create({
        salary_empid: salary.salary_empid,
        salary_paymonth: salary.salary_paymonth,
        salary_payyear: salary.salary_payyear,
        salary_pd: salary.salary_pd,
        salary_share: salary.salary_share,
        salary_tax: salary.salary_tax
    });
}

async function getSalaryMonthYear(month, year){
    return await Salary.findAll({where:{
        salary_paymonth: month,
         salary_payyear: year
        }})
}

async function undoSalaryMonthYear(month, year){
    return await  Salary.destroy({where:{
        salary_paymonth: month,
        salary_payyear: year
        }})
}

module.exports = {
addSalary,
    getSalaryMonthYear,
    undoSalaryMonthYear
}
