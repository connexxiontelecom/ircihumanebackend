const { QueryTypes } = require('sequelize')


const { sequelize, Sequelize } = require('./db');
const LeaveApplication = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes)
const Leave = require("../models/LeaveType")(sequelize, Sequelize.DataTypes)
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)


const helper  = require('../helper');


async function addLeaveApplication(leaveApplicationData){


    return await LeaveApplication.create({
        leapp_empid: leaveApplicationData.leapp_empid,
        leapp_leave_type: leaveApplicationData.leapp_leave_type,
        leapp_start_date: leaveApplicationData.leapp_start_date,
        leapp_end_date: leaveApplicationData.leapp_end_date,
        leapp_total_days: leaveApplicationData.leapp_total_days,
        leapp_year: leaveApplicationData.leapp_year,
        // leapp_verify_by: leaveApplicationData.leapp_verify_by,
        // leapp_verify_date: leaveApplicationData.leapp_verify_date,
        // leapp_verify_comment: leaveApplicationData.leapp_verify_comment,
        // leapp_recommend_by: leaveApplicationData.leapp_recommend_by,
        // leapp_recommend_date: leaveApplicationData.leapp_recommend_date,
        // leapp_recommend_comment: leaveApplicationData.leapp_recommend_comment,
        // leapp_approve_by: leaveApplicationData.leapp_approve_by,
        // leapp_approve_date: leaveApplicationData.leapp_approve_date,
        // leapp_approve_comment: leaveApplicationData.leapp_approve_comment,
        leapp_status: leaveApplicationData.leapp_status,
    });
}


async function findAllLeaveApplication(){

    return await LeaveApplication.findAll({ include: [Leave, 'verify', 'recommend', 'approve'] })
}

async function sumLeaveUsedByYearEmployeeLeaveType(year, employee_id, leave_type){
    return await LeaveApplication.sum('leapp_total_days',{
        where: {
     leapp_empid: employee_id, leapp_leave_type: leave_type, leapp_year: year
        }
    })
}

// async function findLocationAllowanceById(la_id){
//     return await LocationAllowance.findOne({ where: { la_id: la_id }, include: [Location, Pd]  })
// }
//
// async function updateLocationAllowance(locationAllowanceData, la_id){
//
//     return  await LocationAllowance.update({
//         la_payment_id: locationAllowanceData.la_payment_id,
//         la_location_id: locationAllowanceData.la_location_id,
//         la_amount: locationAllowanceData.la_amount
//     },{
//         where:{
//             la_id:la_id
//         } })
// }
//
// async function findLocationAllowanceByPaymentIdLocationId(payment_id, location_id){
//     return await LocationAllowance.findOne({ where: { la_payment_id: payment_id, la_location_id: location_id }, include: [Location, Pd] })
// }


module.exports = {
  addLeaveApplication,
    sumLeaveUsedByYearEmployeeLeaveType,
    findAllLeaveApplication
   }
