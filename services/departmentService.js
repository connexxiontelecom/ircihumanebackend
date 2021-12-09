const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const department = require("../models/Department")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getDepartments = async (req, res)=>{
    const departments =  await department.findAll({attributes: ['department_name','department_id']});
    res.send(departments)
}
const setNewDepartment = async (req, res)=>  {
    await department.create({department_name: req.body.department_name})
        .catch(errHandler);
    res.send(`New department :  ${req.body.department_name} was successfully saved in the database`)
}
const getDepartmentById = async (req, res) =>{
    const department_id  = req.params.id;
    const depart =  await department.findAll({where:{department_id: department_id}});
    res.send(depart);
}
const updateDepartment = async (req, res)=>{
    const department_id = req.params.id;
    const depart = await department.update({
        department_name: req.body.department_name,
    },{
        where:{
            department_id:department_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getDepartmentById,
    getDepartments,
    updateDepartment,
    setNewDepartment,
}