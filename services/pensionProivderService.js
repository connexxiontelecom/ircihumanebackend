const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const pension = require("../models/PensionProvider")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getPensionProviders = async (req, res)=>{
    const providers =  await pension.findAll({attributes: ['provider_name','pension_provider_id']});
    res.status(200).json(providers)
}
const setNewPensionProvider = async (req, res)=>  {
     await pension.create({provider_name: req.body.provider_name})
        .catch(errHandler);
    res.status(200).json(`Pension provider:  ${req.body.provider_name} was successfully saved in the database`)
}
const getPensionProviderById = async (req, res) =>{
    const provider_id  = req.params.id;
    const p =  await pension.findAll({where:{pension_provider_id: provider_id}});
    res.status(200).json(p);
}
const updatePensionProvider = async (req, res)=>{
    const provider_id = req.params.id;
    const b = await pension.update({
        provider_name: req.body.provider_name,
    },{
        where:{
            pension_provider_id:provider_id
        }
    });
    res.status(200).json(`Your changes were saved successfully.`)
}

module.exports = {
    getPensionProviderById,
    getPensionProviders,
    updatePensionProvider,
    setNewPensionProvider,
}
