const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const TimeAllocation = require("../models/timeallocation")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');

async function findAllTimeAllocations() {
    return await TimeAllocation.findAll({
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as: 'employee'}]
    })
}

async function getTimeAllocationListByMonthYear(month, year) {
  return await TimeAllocation.findAll({
    where: {ta_month: month, ta_year: year},
    order: [['ta_id', 'DESC']],
    include: [{model:Employee, as:'employee'}]
  })
}


async function addTimeAllocation(timeAllocationData) {
    return await TimeAllocation.create({
        ta_emp_id: timeAllocationData.ta_emp_id,
        ta_month: timeAllocationData.ta_month,
        ta_year: timeAllocationData.ta_year,
        ta_tcode: timeAllocationData.ta_tcode,
        ta_charge: timeAllocationData.ta_charge,
        ta_ref_no: timeAllocationData.ta_ref_no,
        ta_t0_code: timeAllocationData.ta_t0_code,
        ta_t0_percent: timeAllocationData.ta_t0_percent,
        ta_date_approved: timeAllocationData?.ta_date_approved,

    });
}

async function updateTimeAllocation(timeAllocationData) {
    return await TimeAllocation.create({
        ta_emp_id: timeAllocationData.ta_emp_id,
        ta_month: timeAllocationData.ta_month,
        ta_year: timeAllocationData.ta_year,
        ta_tcode: timeAllocationData.ta_tcode,
        ta_charge: timeAllocationData.ta_charge,
        ta_ref_no: timeAllocationData.ta_ref_no

    });
}

async function deleteTimeAllocation(timeAllocationData) {
    return await TimeAllocation.destroy({
        where: {ta_ref_no: timeAllocationData.ta_ref_no}
    });
}
async function deleteTimeAllocationByIds(Ids) {
    return await TimeAllocation.destroy({
        where: {ta_id: Ids}
    });
}


async function updateTimeAllocationByTaId(ta_id, timeAllocationData){
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

async function findTimeAllocation(empId, month, year) {
    return await TimeAllocation.findAll({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year},
        include: [{model:Employee, as:'employee'}]
    })
}

async function findTimeAllocationDetail(month, year, empId) {
    return await TimeAllocation.findAll({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as:'employee'}]
    })
}

async function findTimeAllocationDetailByStatus(month, year, empId) {
    return await TimeAllocation.findAll({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year, ta_status: [1, 0]},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as:'employee'}]
    })
}
async function findTimeAllocationDetailByRefNo(ref_no) {
    return await TimeAllocation.findAll({
        where: {ta_ref_no:ref_no},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as:'employee'}]
    })
}

async function findOneTimeAllocationDetail(month, year, empId) {
    return await TimeAllocation.findOne({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as: 'employee'}]
    })
}

async function findTimeAllocationDetailMonthYear(month, year) {
    return await TimeAllocation.findOne({
        where: {ta_month: month, ta_year: year},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as:'employee'}]
    })
}

async function findTimeAllocationsDetail(empId, month, year) {
    return await TimeAllocation.findAll({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year},
        include: [{model:Employee, as:'employee'}]
    })
}

async function findTimeAllocationsEmployee(empId) {
    return await TimeAllocation.findAll({
        where: {ta_emp_id: empId},
        order: [['ta_id', 'DESC']],
        include: [{model:Employee, as:'employee'}]
    })
}

async function findTimeAllocationsByRefNo(ref_no) {
    return await TimeAllocation.findAll({
        where: {ta_ref_no: ref_no},
        include: [{model:Employee, as:'employee'}]
    })
}

async function deleteTimeAllocationByRefNo(ref_no) {
    return TimeAllocation.destroy({
        where: {ta_ref_no: ref_no}
    });
}

async function findOneTimeAllocationByRefNo(ref_no) {
    return await TimeAllocation.findOne({
        where: {ta_ref_no: ref_no},
        include: [{model:Employee, as:'employee'}]
    })
}

async function timeAllocationStatus(empId, month, year) {
    return await TimeAllocation.findOne({
        where: {ta_emp_id: empId, ta_month: month, ta_year: year, ta_status: 1},
    })
}

async function sumTimeAllocation(empId, month, year) {
    return await TimeAllocation.sum('ta_charge', {
        where: {ta_emp_id: empId, ta_month: month, ta_year: year, ta_status: 0},
        include: [{model:Employee, as:'employee'}]
    })
}

const getTimeAllocationApplicationsForAuthorization = async (appIds) => {
    return await TimeAllocation.findAll({
        where: {ta_ref_no: appIds}
    })
}


module.exports = {
    addTimeAllocation,
    findTimeAllocation,
    updateTimeAllocation,
    updateTimeAllocationByTaId,
    sumTimeAllocation,
    deleteTimeAllocation,
    getTimeAllocationApplicationsForAuthorization,
    findTimeAllocationDetail,
    findTimeAllocationsDetail,
    findTimeAllocationsEmployee,
    findTimeAllocationsByRefNo,
    findAllTimeAllocations,
    findTimeAllocationDetailMonthYear,
    findOneTimeAllocationByRefNo,
    findOneTimeAllocationDetail,
    deleteTimeAllocationByIds,
    timeAllocationStatus,
    findTimeAllocationDetailByRefNo,
    findTimeAllocationDetailByStatus,
    deleteTimeAllocationByRefNo,
  getTimeAllocationListByMonthYear
}
