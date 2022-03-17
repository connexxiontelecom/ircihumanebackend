const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const Donor = require("../models/donor")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addDonor(donorData) {


    return await Donor.create({
        donor_code: donorData.donor_code,
        donor_description: donorData.donor_description,
    });
}

async function findDonorByCode(donorCode) {
    return await Donor.findOne({where: {donor_code: donorCode}})
}

async function findDonorById(donorId) {
    return await Donor.findOne({where: {donor_id: donorId}})
}

async function updateDonor(donorData, donorId) {

    return await Donor.update({
        donor_code: donorData.donor_code,
        donor_description: donorData.donor_description,
    }, {
        where: {
            donor_id: donorId
        }
    })
}

async function findAllDonors() {
    return await Donor.findAll()
}

module.exports = {
    addDonor,
    findAllDonors,
    findDonorByCode,
    findDonorById,
    updateDonor

}
