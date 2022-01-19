const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const Rating = require("../models/rating")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addRating(ratingData){
    return await Rating.create({
        rating_name: ratingData.rating_name,
        rating_desc: ratingData.rating_desc,

     });
}

async function updateRating(ratingId, ratingData){
    return await Rating.update({
        rating_name: ratingData.rating_name,
        rating_desc: ratingData.rating_desc,

    }, {
            where:{
                rating_id:ratingId
            }
        });
}

async function findRating(ratingId){
    return await Rating.findOne({  where: { rating_id: ratingId } })

}

async function findAllRating(){
    return await Rating.findAll()
}




module.exports = {
    addRating,
    updateRating,
    findRating,
    findAllRating
}
