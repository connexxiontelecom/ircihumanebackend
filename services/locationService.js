const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const location = require("../models/Location")(sequelize, Sequelize.DataTypes)

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getLocations = async (req, res)=>{
    const locations =  await location.findAll({attributes: ['location_name','location_id']});
    res.send(locations)
}
const setNewLocation = async (req, res)=>  {
    await location.create({location_name: req.body.location_name})
        .catch(errHandler);
    res.send(`New location :  ${req.body.location_name} was successfully saved in the database`)
}
const getLocationById = async (req, res) =>{
    const location_id  = req.params.id;
    const loc =  await location.findAll({where:{location_id: location_id}});
    res.send(loc);
}
const updateLocation = async (req, res)=>{
    const location_id = req.params.id;
    const loca = await location.update({
        location_name: req.body.location_name,
    },{
        where:{
            location_id:location_id
        }
    });
    res.send(`Your changes were saved successfully.`)
}

module.exports = {
    getLocationById,
    getLocations,
    updateLocation,
    setNewLocation,
}