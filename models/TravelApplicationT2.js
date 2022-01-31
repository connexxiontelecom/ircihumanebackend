'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TravelApplicationT2 extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    TravelApplicationT2.init({
        t2_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        travelapp_t2_travelapp_id: DataTypes.INTEGER,
        travelapp_t2_id: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'TravelApplicationT2',
        tableName: 'travel_application_t2',
        timestamps:false
    });
    //TravelApplicationBreakdown.hasMany(TravelApplication, { foreignKey: 'ta_breakdown_travelapp_id'})
    return TravelApplicationT2;
};
