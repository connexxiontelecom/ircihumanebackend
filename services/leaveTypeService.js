const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const leaveType = require("../models/LeaveType")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getLeaveTypes = async (req, res)=>{
    const leaves =  await leaveType.findAll({attributes: ['leave_name','leave_type_id', 'leave_duration']});
    res.status(200).json(leaves)
}
const setNewLeaveType = async (req, res)=>  {
    await leaveType.create({leave_name: req.body.leave_name, leave_duration:req.body.leave_duration})
        .catch(errHandler);
    res.status(200).json(`New leave :  ${req.body.leave_name} was successfully saved in the database`)
}
const getLeaveTypeById = async (req, res) =>{
    const leave_type_id  = req.params.id;
    const leave =  await leaveType.findAll({where:{leave_type_id: leave_type_id}});
    res.status(200).json(leave);
}
const updateLeaveType = async (req, res)=>{
    const leave_id = req.params.id;
    const subs = await leaveType.update({
        leave_name: req.body.leave_name,
        leave_duration: req.body.leave_duration,
    },{
        where:{
            leave_type_id:leave_id
        }
    });
    res.status(200).json(`Your changes were saved successfully.`)
}

module.exports = {
    getLeaveTypes,
    getLeaveTypeById,
    updateLeaveType,
    setNewLeaveType,
}
