const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const Rating = require("../models/rating")(sequelize, Sequelize.DataTypes)

const helper = require('../helper');


async function addRating(ratingData) {
    return await Rating.create({
        rating_name: ratingData.rating_name,
        rating_desc: ratingData.rating_desc,
        rating_time_period: ratingData.rating_period,
    });
}

async function updateRating(ratingId, ratingData) {
    return await Rating.update({
        rating_name: ratingData.rating_name,
        rating_desc: ratingData.rating_desc,

    }, {
        where: {
            rating_id: ratingId
        }
    });
}

async function updateRatingStatus(ratingId, ratingData) {
  return await Rating.update({
    rating_status: ratingData.rating_status,

  }, {
    where: {
      rating_id: ratingId
    }
  });
}

async function findRating(ratingId) {
    return await Rating.findOne({where: {rating_id: ratingId}})

}

async function findRatingByName(ratingName) {
    return await Rating.findOne({where: {rating_name: ratingName}})

}

async function findAllRating() {
    return await Rating.findAll()
}

async function findAllEndYearRatings() {
  return await Rating.findAll({where: {rating_time_period: 3, rating_status: 1}})
}

module.exports = {
    addRating,
    updateRating,
    findRating,
    findAllRating,
    findRatingByName,
  updateRatingStatus,
  findAllEndYearRatings
}
