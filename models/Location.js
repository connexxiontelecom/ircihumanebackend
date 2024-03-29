'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
const State = require("../models/State")(sequelize, Sequelize.DataTypes);
//const LocationAllowance = require("../models/locationallowance")(sequelize, Sequelize.DataTypes)
module.exports = (sequelize, DataTypes) => {
    class Location extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

        static async addLocation(data){
          return await Location.create(data);
        }

        static async getLocationById(locationId){
          return await Location.findOne({where:{location_id: locationId}})
        }
    };
    Location.init({
        location_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        location_name: DataTypes.STRING,
        l_state_id: DataTypes.INTEGER,
        l_t6_code: DataTypes.STRING,
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'Location',
        tableName: 'locations'
    });
    Location.belongsTo(State, { foreignKey: 'l_state_id' });
    Location.hasMany(State, { foreignKey: 's_id' });

    //Location.belongsTo(LocationAllowance, { foreignKey: 'la_location_id' })
    return Location;
};
