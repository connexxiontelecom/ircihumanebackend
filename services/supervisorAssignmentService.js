const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const SupervisorAssignment = require("../models/supervisorassignment")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addAssignment(supervisorAssignmentData){


    return await SupervisorAssignment.create({
        sa_emp_id:supervisorAssignmentData.sa_emp_id,
        sa_supervisor_id: supervisorAssignmentData.sa_supervisor_id,
        sa_status: 1,
     });
}

async function findLastActiveAssignment(saEmpId){
    return await SupervisorAssignment.findAll({ limit: 1, where: { sa_emp_id: saEmpId, sa_status: 1 }, order: [ [ 'createdAt', 'DESC' ]] })
}

async function updateAssignment(saId){

    return  await SupervisorAssignment.update({
        sa_status: 0,
    },{
        where:{
            sa_id:saId
        } })
}


async function findAllAssignments(){
    return await SupervisorAssignment.findAll({ order: [
            ['sa_id', 'DESC'],
        ], include: ['employee', 'supervisor'] })
}

async function getEmployeeSupervisor(emp_id){
    return await SupervisorAssignment.findOne({
        where:{sa_emp_id:emp_id, sa_status: 1},
    });
}

module.exports = {
    addAssignment,
    findAllAssignments,
    findLastActiveAssignment,
    updateAssignment,
    getEmployeeSupervisor,
}
