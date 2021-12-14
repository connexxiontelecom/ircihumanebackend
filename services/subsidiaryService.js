const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const subsidiary = require("../models/Subsidiary")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getSubsidiaries = async (req, res)=>{
    const subsidiaries =  await subsidiary.findAll({attributes: ['subsidiary_name','subsidiary_id']});
    res.status(200).json(subsidiaries)
}
const setNewSubsidiary = async (req, res)=>  {
    await subsidiary.create({subsidiary_name: req.body.subsidiary_name})
        .catch(errHandler);
    res.status(200).json(`New subsidiary :  ${req.body.subsidiary_name} was successfully saved in the database`)
}
const getSubsidiaryById = async (req, res) =>{
    const subsidiary_id  = req.params.id;
    const sub =  await subsidiary.findAll({where:{subsidiary_id: subsidiary_id}});
    res.status(200).json(sub);
}
const updateSubsidiary = async (req, res)=>{
    const subsidiary_id = req.params.id;
    const subs = await subsidiary.update({
        subsidiary_name: req.body.subsidiary_name,
    },{
        where:{
            subsidiary_id:subsidiary_id
        }
    });
    res.status(200).json(`Your changes were saved successfully.`)
}

module.exports = {
    getSubsidiaries,
    getSubsidiaryById,
    updateSubsidiary,
    setNewSubsidiary,
}
