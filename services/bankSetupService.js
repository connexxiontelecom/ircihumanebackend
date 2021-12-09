const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const bank = require("../models/Bank")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    //return res.status(403).json(`Error ${err}`)
    console.log("Error: ", err);
}
const getBanks = async (req, res)=>{
    const banks =  await bank.findAll({attributes: ['bank_name', 'bank_id', 'bank_code']});
    return res.status(200).json(banks)

}
const setNewBank = async (req, res)=>  {
    const n_bank = await bank.create({bank_name: req.body.bank_name, bank_code: req.body.bank_code})
        .catch(errHandler);
   return res.status(200).json(`Bank ${req.body.bank_name} was successfully saved in the database`)

}
const getBankById = async (req, res) =>{
    const bank_id  = req.params.id;
    const b =  await bank.findAll({where:{bank_id: bank_id}});
    return res.status(200).json(b)

}
const updateBank = async (req, res)=>{
    const bank_id = req.params.id;
    const b = await bank.update({
       bank_name: req.body.bank_name,
       bank_code: req.body.bank_code
    },{
        where:{
            bank_id:bank_id
        }
    });
    return res.status(200).json(`Your changes were saved successfully.`)
}

module.exports = {
    getBanks,
    setNewBank,
    getBankById,
    updateBank,
}
