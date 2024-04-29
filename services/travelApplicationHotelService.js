const { sequelize, Sequelize } = require('./db');
const travelApplicationHotel = require('../models/TravelApplicationHotel')(sequelize, Sequelize.DataTypes);
const setNewTravelApplicationHotel = async (hotel, travelapp_id) => {
  try {
    await travelApplicationHotel.create({
      ta_hotel_travelapp_id: travelapp_id,
      ta_hotel_name: hotel.name,
      ta_hotel_city: hotel.city,
      ta_hotel_country: hotel.country,
      ta_hotel_arrival_date: hotel.arrival_date,
      ta_hotel_departure_date: hotel.departure_date
    });
  } catch (e) {
    console.log(`Something went wrong while setting travel application hotel: ${e.message}`);
  }
};

const findHotelsByTravelApplicationId = async (travelapp_id) => {
  return await travelApplicationHotel.findAll({ where: { ta_hotel_travelapp_id: travelapp_id } });
};

module.exports = {
  setNewTravelApplicationHotel,
  findHotelsByTravelApplicationId
};
