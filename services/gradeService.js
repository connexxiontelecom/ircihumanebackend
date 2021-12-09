const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const grade = require("../models/Grade")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getGrades = async (req, res)=>{
    const grades =  await grade.findAll({attributes: ['grade_name','grade_id']});
    res.send(grades)
}
const setNewGrade = async (req, res)=>  {
    await grade.create({grade_name: req.body.grade_name})
        .catch(errHandler);
    res.send(`New grade :  ${req.body.grade_name} was successfully saved in the database`)
}
const getGradeById = async (req, res) =>{
    const grade_id  = req.params.id;
    const grade =  await grade.findAll({where:{grade_id: grade_id}});
    res.send(grade);
}
const updateGrade = async (req, res)=>{
    const grade_id = req.params.id;
    const grade = await grade.update({
        grade_name: req.body.grade_name,
    },{
        where:{
            grade_id:grade_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getGradeById,
    getGrades,
    updateGrade,
    setNewGrade,
}