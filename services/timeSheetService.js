const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const TimeSheet = require("../models/timesheet")(sequelize, Sequelize.DataTypes)
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);

const helper  = require('../helper');


async function addTimeSheet(timeSheetData){
    return await TimeSheet.create({
        ts_emp_id: timeSheetData.ts_emp_id,
        ts_month: timeSheetData.ts_month,
        ts_year: timeSheetData.ts_year,
        ts_day: timeSheetData.ts_day,
        ts_start: timeSheetData.ts_start,
        ts_end: timeSheetData.ts_end,
        ts_duration: timeSheetData.ts_duration,
     });
}


async function updateTimeSheet(ts_id, timeSheetData){
    return await TimeSheet.update({
        ts_emp_id: timeSheetData.ts_emp_id,
        ts_month: timeSheetData.ts_month,
        ts_year: timeSheetData.ts_year,
        ts_day: timeSheetData.ts_day,
        ts_start: timeSheetData.ts_start,
        ts_end: timeSheetData.ts_end,
        ts_duration: timeSheetData.ts_duration,

    }, {
            where:{
                ts_id:ts_id
            }
        });
}

async function findTimeSheet(empId, day, month, year){
    return await TimeSheet.findOne({  where: { ts_emp_id: empId, ts_day: day, ts_month: month, ts_year: year } })

}

async function findTimeSheetMonthEmployee(empId,  month, year){
    return await TimeSheet.findAll({  where: { ts_emp_id: empId, ts_month: month, ts_year: year } })

}

async function getLatestTimeSheet(){
    return await TimeSheet.findOne({order: [
            ['ts_id', 'DESC'],
        ]});
}

async function findTimeSheetMonth(empId, month, year){
    return await TimeSheet.findAll({
        group:['ts_month', 'ts_year'],
       /* attributes:[
            [sequelize.fn('distinct', sequelize.col('ts_month')), 'thisMonth'],
            [sequelize.fn('distinct', sequelize.col('ts_year')), 'thisYear']
        ],*/
        where: { ts_emp_id: empId, ts_month: month, ts_year: year}
    })
}

async function updateTimeSheetStatus(comment, userId, status, randStr, ts_id){
      return await TimeSheet.update({
          ts_status:status,
          ts_comment:comment,
          ts_date_approved:new Date(),
          ts_approve_by:userId,
          ts_ref_no: randStr

        }, {
            where:{
                ts_id:ts_id
            }
        });


}

const getTimeSheetApplicationsForAuthorization = async (month, year)=>{
    return await TimeSheet.findAll({
        where:  { ts_year:year},
        //where: { where:Sequelize.and({ts_year:year}) },
        include:[EmployeeModel]
    })
}
/*const getTimeAllocationApplicationsForAuthorization = async (month, year)=>{
    return await TimeAllocation.findAll({
        where: {ta_month:month, ta_year:year}
    })
}*/

module.exports = {
    addTimeSheet,
    findTimeSheet,
    updateTimeSheet,
    findTimeSheetMonth,
    getLatestTimeSheet,
    updateTimeSheetStatus,
    getTimeSheetApplicationsForAuthorization,
    findTimeSheetMonthEmployee
}
