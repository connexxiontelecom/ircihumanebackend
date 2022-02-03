const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const travelApplicationModel = require("../models/TravelApplication")(sequelize, Sequelize.DataTypes);
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const travelApplicationBreakdownModel = require("../models/TravelApplicationBreakdown")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getTravelApplications = async (req, res)=>{
    try{
        const travelapps =  await travelApplicationModel.findAll();
        res.status(200).json(travelapps)

    }catch (e) {
        res.status(400).json({message: "Something went wrong. Try again. "+e.message});
    }
}

const getTravelApplicationsByEmployeeId = async (employee)=>{
    return await travelApplicationModel.findAll({where:{travelapp_employee_id:employee} ,include: [EmployeeModel] } );
}

const getTravelApplicationsById = async (id)=>{
    return await travelApplicationModel.findOne({where:{travelapp_id:id} });
}


const setNewTravelApplication = async (travelData, days )=>{
    return await travelApplicationModel.create({
        travelapp_employee_id: travelData.employee,
        travelapp_travel_cat: travelData.travel_category,
        travelapp_purpose: travelData.purpose,
        travelapp_start_date: travelData.start_date,
        travelapp_end_date: travelData.end_date,
        travelapp_total_days: days,
        travelapp_t1_code: travelData.t1_code,
        //travelapp_t2_code: travelData.t2_code,
        travelapp_per_diem:travelData.travel_category === 1 ? travelData.per_diem : 0,
        travelapp_days:days,
        travelapp_currency:travelData.travel_category === 1 ?  travelData.currency : '',
        travelapp_total:travelData.travel_category === 1 ? travelData.total : '',
        travelapp_hotel:travelData.hotel,
        travelapp_city:travelData.hotel === 1 ? travelData.city : '',
        travelapp_arrival_date:travelData.hotel === 1 ? travelData.arrival_date : null,
        travelapp_departure_date:travelData.hotel === 1 ? travelData.departure_date : null,
        travelapp_preferred_hotel:travelData.hotel === 1 ? travelData.preferred_hotel : null,

    });
}

module.exports = {
    getTravelApplications,
    setNewTravelApplication,
    getTravelApplicationsByEmployeeId,
    getTravelApplicationsById,
}