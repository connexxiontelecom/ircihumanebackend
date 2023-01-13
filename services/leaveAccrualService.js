const {QueryTypes, Op} = require('sequelize')
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
        lea_leaveapp_id: accrualData.lea_leaveapp_id,
        lea_expires_on: accrualData.lea_expires_on,
        lea_fy: accrualData.lea_fy,
        leave_narration: accrualData.leave_narration,
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

async function archiveLeaveAccrualByLeaveApplication(empId, month, year, type) {
    return await LeaveAccrual.update({
      lea_archives: 1,
    }, {
      where: {
        lea_emp_id: empId,
        lea_month: month,
        lea_year: year,
        lea_leave_type: type,
      }
    })
}
async function archiveAccrual(leaId) {
    return await LeaveAccrual.update({
      lea_archives: 1,
    }, {
      where: {
        lea_id: leaId,
      }
    })
}
async function findLeaveAccrualByLeaveApplication(empId, month, year, type) {
    return await LeaveAccrual.findOne({
      where: {
        lea_emp_id: empId,
        lea_month: month,
        lea_year: year,
        lea_leave_type: type,
      }
    })
}

async function findLeaveAccrualByLeaveTypePositive(empId, month, year, type) {
    return await LeaveAccrual.findOne({
      where: {
          lea_emp_id: empId,
          lea_month: month,
          lea_year: year,
          lea_leave_type: type,
          lea_rate: {[Op.gt]: 0}
      }
    })
}

async function findLeaveAccrualByLeaveTypeFYyearPositive(empId, month, year, fyYear, type) {
    return await LeaveAccrual.findOne({
      where: {
          lea_emp_id: empId,
          lea_month: month,
          lea_year: year,
          lea_leave_type: type,
          lea_fy: fyYear,
          lea_rate: {[Op.gt]: 0}
      }
    })
}

async function findLeaveAccrualByLeaveTypeFYyearPositiveExcludeMonth(empId, fyYear, type) {
    return await LeaveAccrual.findOne({
        where: {
            lea_emp_id: empId,
            lea_leave_type: type,
            lea_fy: fyYear,
            lea_rate: {[Op.gt]: 0}
        }
    })
}


async function findLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    return await LeaveAccrual.findAll({where: {lea_emp_id: employee_id, lea_year: year, lea_leave_type: leave_type}})
}

async function sumLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    const currentMonth = new Date().getMonth()+1;
    const currentYear = new Date().getFullYear();
    const calendarYear =  currentMonth <= 9 ? `FY${currentYear}` : `FY${currentYear+1}`;
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            //lea_fy: calendarYear,
            lea_leave_type: leave_type,
            lea_fy: calendarYear
        }
    })
}

async function sumPositiveLeaveAccrualByYearMonthEmployeeLeaveType(year, month, employee_id, leave_type) {
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            lea_fy: year,
            lea_month: {
                [Op.lte]: month
            },
            lea_leave_type: leave_type,
            lea_rate: {[Op.gt]: 0}
        }
    })
}

async function sumNegativeLeaveAccrualByYearMonthEmployeeLeaveType(year, month, employee_id, leave_type) {
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            lea_fy: year,
            lea_month: {
                [Op.lte]: month
            },
            lea_leave_type: leave_type,
            lea_rate: {[Op.lt]: 0}
        }
    })
}

async function getPositiveLeaveAccrualByYearMonthEmployeeLeaveType(year, month, employee_id, leave_type) {
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            lea_fy: year,
            lea_month: {
                [Op.lte]: month
            },
            lea_leave_type: leave_type,
            lea_rate: {[Op.gt]: 0}
        }
    })
}

async function getNegativeLeaveAccrualByYearMonthEmployeeLeaveType(year, month, employee_id, leave_type) {
    return await LeaveAccrual.sum('lea_rate', {
        where: {
            lea_emp_id: employee_id,
            lea_fy: year,
            lea_month: {
                [Op.lte]: month
            },
            lea_leave_type: leave_type,
            lea_rate: {[Op.lt]: 0}
        }
    })
}

async function sumAllLeaveByEmployeeYear(year, empId, leaveType) {


    return await LeaveAccrual.findAll({
        attributes: [
            [sequelize.literal(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate > 0 AND lea_emp_id = ${empId} AND lea_year = ${year} AND lea_leave_type = ${leaveType} ) `),'totalAccrued'],
            [sequelize.literal(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate < 0 AND lea_emp_id = ${empId} AND lea_year = ${year} AND lea_leave_type = ${leaveType}) `),'totalTaken'],
            [sequelize.literal(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_archives = 1 AND lea_emp_id = ${empId} AND lea_year = ${year} AND lea_leave_type = ${leaveType}) `),'totalArchived'],
            [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued'],
        ],
        where: {
                lea_emp_id: empId,
                lea_year: year,
                lea_leave_type: leaveType,
            }

    });

}

async function getArchivedLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    return await LeaveAccrual.findAll({where: {lea_emp_id: employee_id, lea_fy: year, lea_leave_type: leave_type, lea_archives: 1}})
}

async function getTotalTakenLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {

   return sequelize.query(
       'SELECT SUM(lea_rate) AS totalTaken FROM leave_accruals WHERE lea_emp_id = :employee_id AND lea_fy = :year AND lea_leave_type = :leave_type AND lea_rate < 0',
       {
           replacements: { employee_id: employee_id, year: year, leave_type: leave_type },
           type: QueryTypes.SELECT
       }
   )
    // return await LeaveAccrual.findAll( {
    //     attributes: [
    //         [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalTaken']
    //         ],
    //     where: {
    //         lea_emp_id: employee_id,
    //         lea_year: year,
    //         lea_leave_type: leave_type,
    //         lea_rate: {[Op.lt]: 0}
    //     }
    // })
}

async function getTotalAccruedLeaveAccrualByYearEmployeeLeaveType(year, employee_id, leave_type) {
    return sequelize.query('SELECT SUM(lea_rate) AS totalAccrued FROM leave_accruals WHERE lea_emp_id = :employee_id AND lea_fy = :year AND lea_leave_type = :leave_type AND lea_rate > 0',
        {
            replacements: { employee_id: employee_id, year: year, leave_type: leave_type },
            type: QueryTypes.SELECT
        })
    // return await LeaveAccrual.findAll( {
    //     attributes: [
    //         [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued']
    //     ],
    //     where: {
    //         lea_emp_id: employee_id,
    //         lea_year: year,
    //         lea_leave_type: leave_type,
    //         lea_rate: {[Op.gt]: 0}
    //     }
    // })
}

async function getEmployeeLeaveAccrualDetails(year, employee_id) {
  return await LeaveAccrual.findAll({
    where:{lea_emp_id: employee_id, lea_fy: year}
  });

}
/*
async function getEmployeeMonthsAccrual(year, month, employee_id, leave_type) {
  return sequelize.query('SELECT SUM(lea_rate) AS totalAccrued FROM leave_accruals WHERE lea_emp_id = :employee_id AND lea_fy = :year AND lea_leave_type = :leave_type AND lea_month = :month',
    {
      replacements: { employee_id: employee_id, year: year, leave_type: leave_type, month:month },
      type: QueryTypes.SELECT
    })
}
async function getEmployeeMonthsUsed(year, month, employee_id, leave_type) {
  return sequelize.query('SELECT SUM(lea_rate) AS totalAccrued FROM leave_accruals WHERE lea_emp_id = :employee_id AND lea_fy = :year AND lea_leave_type = :leave_type AND lea_month = :month AND lea_rate < 0',
    {
      replacements: { employee_id: employee_id, year: year, leave_type: leave_type, month:month },
      type: QueryTypes.SELECT
    })
}*/
async function getLeaveAccruals(){
  return await LeaveAccrual.findAll();
}





module.exports = {
    addLeaveAccrual,
    findLeaveAccrualByYearEmployeeLeaveType,
    sumLeaveAccrualByYearEmployeeLeaveType,
    removeLeaveAccrual,
    removeLeaveAccrualEmployees,
    removeLeaveAccrualByLeaveApplication,
    sumAllLeaveByEmployeeYear,
    getArchivedLeaveAccrualByYearEmployeeLeaveType,
    getTotalTakenLeaveAccrualByYearEmployeeLeaveType,
    getTotalAccruedLeaveAccrualByYearEmployeeLeaveType,
  archiveLeaveAccrualByLeaveApplication,
  findLeaveAccrualByLeaveApplication,
  getLeaveAccruals,
  archiveAccrual,
    findLeaveAccrualByLeaveTypePositive,
    findLeaveAccrualByLeaveTypeFYyearPositive,
    findLeaveAccrualByLeaveTypeFYyearPositiveExcludeMonth,
    sumPositiveLeaveAccrualByYearMonthEmployeeLeaveType,
    sumNegativeLeaveAccrualByYearMonthEmployeeLeaveType,
    getEmployeeLeaveAccrualDetails,
    getPositiveLeaveAccrualByYearMonthEmployeeLeaveType,
    getNegativeLeaveAccrualByYearMonthEmployeeLeaveType,
    //getEmployeeMonthsAccrual,
    //getEmployeeMonthsUsed,

}
