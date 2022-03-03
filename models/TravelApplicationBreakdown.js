'use strict';
const {sequelize, Sequelize} = require("../services/db");
const TravelApplication = require("../models/TravelApplication")(sequelize, Sequelize.DataTypes)
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TravelApplicationBreakdown extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    TravelApplicationBreakdown.init({
        ta_breakdown_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        ta_breakdown_travelapp_id: DataTypes.INTEGER,
        ta_breakdown_from: DataTypes.STRING,
        ta_breakdown_date: DataTypes.DATE,
        ta_breakdown_mode: {type:DataTypes.INTEGER,defaultValue:1,comment:"1=Road,2=Air"},
        ta_breakdown_prompt:{type:DataTypes.INTEGER, defaultValue: 1,comment:"1=AM,2=PM"},
        ta_breakdown_destination:DataTypes.STRING,
       /* createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },*/
    }, {
        sequelize,
        modelName: 'TravelApplicationBreakdown',
        tableName: 'travel_application_breakdown',
        timestamps:false
    });
    TravelApplicationBreakdown.hasMany(TravelApplication, { foreignKey: 'ta_breakdown_travelapp_id'})
    return TravelApplicationBreakdown;
};
