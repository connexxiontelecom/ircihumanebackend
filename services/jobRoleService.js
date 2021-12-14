const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const jobRole = require("../models/JobRole")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getJobRoles = async (req, res)=>{
    const roles =  await jobRole.findAll({attributes: ['job_role','department_id', 'job_role_id', 'description']});
    res.status(200).json(roles)
}
const setNewJobRole = async (req, res)=>  {
    await jobRole.create({job_role: req.body.job_role,department_id:req.body.department_id,description:req.body.description})
        .catch(errHandler);
    res.status(200).json(`New job role :  ${req.body.job_role} was successfully saved in the database`)
}
const getJobRoleById = async (req, res) =>{
    const role_id  = req.params.id;
    const role =  await jobRole.findAll({where:{job_role_id: role_id}});
    res.status(200).json(role);
}
const updateJobRole = async (req, res)=>{
    const role_id = req.params.id;
    const role = await jobRole.update({
        job_role: req.body.job_role,
        description:req.body.description,
        department_id:req.body.department_id
    },{
        where:{
            job_role_id:role_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getJobRoleById,
    getJobRoles,
    updateJobRole,
    setNewJobRole,
}
