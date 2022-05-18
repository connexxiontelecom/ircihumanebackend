const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const Donor = require("../models/donor")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addDonor(donorData) {


    return await Donor.create({
        donor_code: donorData.donor_code,
        donor_description: donorData.donor_description,
        donor_location: donorData.location,
    });
}

async function findDonorByCode(donorCode) {
    return await Donor.findOne({where: {donor_code: donorCode}})
}

async function findDonorById(donorId) {
    return await Donor.findOne({where: {donor_id: donorId}})
}

async function findDonorByLocationId(locationId) {
    return await Donor.findOne({where: {donor_location: locationId}})
}

async function updateDonor(donorData, donorId) {

    return await Donor.update({
        donor_code: donorData.donor_code,
        donor_description: donorData.donor_description,
        donor_location: donorData.location,
    }, {
        where: {
            donor_id: donorId
        }
    })
}

async function findAllDonors() {
    return await Donor.findAll({
      include:['location']
    })
}

module.exports = {
    addDonor,
    findAllDonors,
    findDonorByCode,
    findDonorById,
    updateDonor,
    findDonorByLocationId

}
