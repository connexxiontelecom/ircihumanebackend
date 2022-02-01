const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const EndYearRating = require("../models/endyearratings")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addRating(ratingData){
    return await EndYearRating.create({
        eyr_empid: ratingData.eyr_empid,
        eyr_year: ratingData.eyr_year,
        eyr_rating: ratingData.eyr_rating,

     });
}


async function findEmployeeRating(empId, year){
    return await EndYearRating.findOne({  where: { eyr_empid: empId, eyr_year: year } })

}




module.exports = {
    addRating,
    findEmployeeRating,
}
