const { sequelize } = require('../services/db');
const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TravelApplicationHotel extends Model {
    static associate(models) {}
  }

  TravelApplicationHotel.init(
    {
      ta_hotel_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ta_hotel_travelapp_id: DataTypes.INTEGER,
      ta_hotel_name: DataTypes.STRING,
      ta_hotel_city: DataTypes.STRING,
      ta_hotel_country: DataTypes.STRING,
      ta_hotel_arrival_date: DataTypes.DATE,
      ta_hotel_departure_date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'TravelApplicationHotel',
      tableName: 'travel_application_hotels'
    }
  );

  return TravelApplicationHotel;
};
