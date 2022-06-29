const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const LeaveAccrual = require("../models/leaveaccrual")(sequelize, Sequelize.DataTypes)


async function addLeaveAccrual(accrualData) {


    return await LeaveAccrual.create({
        lea_emp_id: accrualData.lea_emp_id,
        lea_month: accrualData.lea_month,
        lea_year: accrualData.lea_year,
        lea_leave_type: accrualData.lea_leave_type,
        lea_rate: accrualData.lea_rate,
        lea_archives: 0,
        lea_leaveapp_id: 0
    });
}


async function removeLeaveAccrual(accrualData) {
    return await LeaveAccrual.destroy({
        where: {
            lea_month: accrualData.lea_month,
            lea_year: accrualData.lea_year,
        }
    });
}

async function removeLeaveAccrualEmployees(accrualData) {
    return await LeaveAccrual.destroy({
        where: {
            lea_month: accrualData.lea_month,
            lea_year: accrualData.lea_year,
            lea_emp_id: accrualData.lea_emp_id

        }
    });
}

async function removeLeaveAccrualByLeaveApplication(leaveAppId) {
    return await LeaveAccrual.destroy({
        where: {
            lea_leaveapp_id: leaveAppId,
        }
    });
}


async function findLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    return await LeaveAccrual.findAll({where: {lea_emp_id: employee_id, lea_year: year, lea_leave_type: leave_type}})
}

async function sumLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            lea_year: year,
            lea_leave_type: leave_type,
            lea_archives: 0
        }
    })
}


module.exports = {
    addLeaveAccrual,
    findLeaveAccrualByYearEmployeeLeaveType,
    sumLeaveAccrualByYearEmployeeLeaveType,
    removeLeaveAccrual,
    removeLeaveAccrualEmployees,
    removeLeaveAccrualByLeaveApplication

}
