const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const TimeAllocation = require("../models/timeallocation")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addTimeAllocation(timeAllocationData){
    return await TimeAllocation.create({
        ta_emp_id: timeAllocationData.ta_emp_id,
        ta_month: timeAllocationData.ta_month,
        ta_year: timeAllocationData.ta_year,
        ta_tcode: timeAllocationData.ta_tcode,
        ta_charge: timeAllocationData.ta_charge

     });
}

async function updateTimeAllocation(ta_id, timeAllocationData){
    return await TimeAllocation.update({
        ta_emp_id: timeAllocationData.ta_emp_id,
        ta_month: timeAllocationData.ta_month,
        ta_year: timeAllocationData.ta_year,
        ta_tcode: timeAllocationData.ta_tcode,
        ta_charge: timeAllocationData.ta_charge

    }, {
            where:{
                ta_id:ta_id
            }
        });
}

async function findTimeAllocation(empId, month, year){
    return await TimeAllocation.findAll({  where: { ta_emp_id: empId, ta_month: month, ta_year: year } })

}

async function sumTimeAllocation(empId, month, year){
    return await TimeAllocation.sum('ta_charge',{  where: { ta_emp_id: empId, ta_month: month, ta_year: year }})
}




module.exports = {
    addTimeAllocation,
    findTimeAllocation,
    updateTimeAllocation,
    sumTimeAllocation
}
