'use strict';
const { sequelize, Sequelize } = require('../services/db');
const TravelApplication = require('../models/TravelApplication')(sequelize, Sequelize.DataTypes);
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TravelApplicationTraveller extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  TravelApplicationTraveller.init(
    {
      ta_traveller_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ta_traveller_travelapp_id: DataTypes.INTEGER,
      ta_traveller_name: DataTypes.STRING,
      ta_traveller_phone: DataTypes.STRING,
      ta_traveller_t7: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'TravelApplicationTraveller',
      tableName: 'travel_application_travellers'
    }
  );

  return TravelApplicationTraveller;
};
