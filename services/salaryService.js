const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const Salary = require("../models/salary")(sequelize, Sequelize.DataTypes);
const PaymentDefinition = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes);
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const VariationalPayment = require("../models/VariationalPayment")(sequelize, Sequelize.DataTypes)
const Joi = require('joi');

async function addSalary(salary) {
    return await Salary.create({
        salary_empid: salary.salary_empid,
        salary_paymonth: salary.salary_paymonth,
        salary_payyear: salary.salary_payyear,
        salary_pd: salary.salary_pd,
        salary_share: salary.salary_share,
        salary_tax: salary.salary_tax,
        salary_amount: salary.salary_amount,
        salary_location_id: salary.salary_location_id,
        salary_jobrole_id: salary.salary_jobrole_id,
        salary_department_id: salary.salary_department_id,
        salary_gross: salary.salary_gross,
        salary_grade: salary.salary_grade,
        salary_emp_name: salary.salary_emp_name,
        salary_emp_unique_id: salary.salary_emp_unique_id,
        salary_emp_start_date: salary.salary_emp_start_date,
        salary_emp_end_date: salary.salary_emp_end_date
    });
}

async function getSalaryMonthYear(month, year) {
    return await Salary.findAll({
        where: {
            salary_paymonth: month,
            salary_payyear: year
        }
    })
}

async function undoSalaryMonthYear(month, year, employees) {
    return await Salary.destroy({
        where: {
            salary_paymonth: month,
            salary_payyear: year,
            salary_empid: employees
        }
    })
}

async function undoSalaryMonthYearLocation(month, year, locationId) {
    return await Salary.destroy({
        where: {
            salary_paymonth: month,
            salary_payyear: year,
            salary_location_id: locationId
        }
    })
}

async function getDistinctEmployeesLocationMonthYear(month, year, locationId){
    return await Salary.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('salary_empid')) ,'salary_empid']

        ],
        where: {
            salary_paymonth: month,
            salary_payyear: year,
            salary_location_id: locationId
        }

       //include: ['employee']
    })
}

async function getDistinctEmployeesMonthYear(month, year){
    return await Salary.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('salary_empid')) ,'salary_empid'],

        ],
        where: {
            salary_paymonth: month,
            salary_payyear: year,
        }
    })
}

async function getEmployeeSalary(month, year, empId) {
    return await Salary.findAll({
        where: {
            salary_paymonth: month,
            salary_payyear: year,
            salary_empid: empId
        }, include: ['employee', 'payment']
    })
}

async function getEmployeeSalaryMonthYearPd(month, year, empId, pd) {
    return await Salary.findOne({
        where: {
            salary_paymonth: month,
            salary_payyear: year,
            salary_empid: empId,
            salary_pd: pd
        }, include: ['employee', 'payment']
    })
}

async function approveSalary(month, year, user, date, location) {
    return await Salary.update({
            salary_approved: 1,
            salary_approved_by: user,
            salary_approved_date: date
        },
        {
            where: {
                salary_paymonth: month,
                salary_payyear: year,
                salary_location_id: location

            },
        })
}

async function confirmSalary(month, year, user, date, location) {
    return await Salary.update({
            salary_confirmed: 1,
            salary_confirmed_by: user,
            salary_confirmed_date: date
        },
        {
            where: {
                salary_paymonth: month,
                salary_payyear: year,
                salary_location_id: location

            },
        })
}

async function getSalaryPd(pd) {
    return await Salary.findOne({
        where: {
            salary_pd: pd
        }
    })
}

module.exports = {
    addSalary,
    getSalaryMonthYear,
    undoSalaryMonthYear,
    getEmployeeSalary,
    approveSalary,
    confirmSalary,
    getEmployeeSalaryMonthYearPd,
    undoSalaryMonthYearLocation,
    getDistinctEmployeesLocationMonthYear,
    getDistinctEmployeesMonthYear,
    getSalaryPd
}
