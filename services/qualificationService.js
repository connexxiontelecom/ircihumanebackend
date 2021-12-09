const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const qualification = require("../models/Qualification")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getQualifications = async (req, res)=>{
    const qualifications =  await qualification.findAll({attributes: ['qualification_name','qualification_id']});
    res.send(qualifications)
}
const setNewQualification = async (req, res)=>  {
    await qualification.create({qualification_name: req.body.qualification_name})
        .catch(errHandler);
    res.send(`New qualification :  ${req.body.qualification_name} was successfully saved in the database`)
}
const getQualificationById = async (req, res) =>{
    const qualification_id  = req.params.id;
    const qualifi =  await qualification.findAll({where:{qualification_id: qualification_id}});
    res.send(qualifi);
}
const updateQualification = async (req, res)=>{
    const qualification_id = req.params.id;
    const quali = await qualification.update({
        qualification_name: req.body.qualification_name,
    },{
        where:{
            qualification_id:qualification_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getQualificationById,
    getQualifications,
    updateQualification,
    setNewQualification,
}