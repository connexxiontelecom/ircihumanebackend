const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const hmo = require("../models/Hmo")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getHmos = async (req, res)=>{
    const hmos =  await hmo.findAll({attributes: ['hmo_name','hmo_id']});
    res.send(hmos)
}
const setNewHmo = async (req, res)=>  {
    await hmo.create({hmo_name: req.body.hmo_name})
        .catch(errHandler);
    res.send(`New HMO :  ${req.body.hmo_name} was successfully saved in the database`)
}
const getHmoById = async (req, res) =>{
    const hmo_id  = req.params.id;
    const h =  await hmo.findAll({where:{hmo_id: hmo_id}});
    res.send(h);
}
const updateHmo = async (req, res)=>{
    const hmo_id = req.params.id;
    const h = await hmo.update({
        hmo_name: req.body.hmo_name,
    },{
        where:{
            hmo_id:hmo_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getHmoById,
    getHmos,
    updateHmo,
    setNewHmo,
}