const {sequelize, Sequelize} = require("./db");
const travelApplicationTraveller = require('../models/TravelApplicationTraveller')(sequelize, Sequelize.DataTypes);
const setNewTravelApplicationTraveller = async (traveller, travelapp_id) => {
  try {
    await travelApplicationTraveller.create({
      ta_traveller_travelapp_id: travelapp_id,
      ta_traveller_name: traveller.name,
      ta_traveller_phone: traveller.phone,
      ta_traveller_t7: traveller.t7,
    })
  } catch (e) {
    console.log(`Something went wrong while setting travel application traveller: ${e.message}`);
  }
}

const findTravellersByTravelApplicationId = async (travelapp_id) => {
  return await travelApplicationTraveller.findAll({ where: {ta_traveller_travelapp_id: travelapp_id } });
}

module.exports = {
  setNewTravelApplicationTraveller,
  findTravellersByTravelApplicationId
}