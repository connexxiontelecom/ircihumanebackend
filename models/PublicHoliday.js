'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PublicHoliday extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    PublicHoliday.init({
        ph_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ph_name: DataTypes.STRING,
        ph_day: DataTypes.STRING,
        ph_month: DataTypes.STRING,
        ph_year: DataTypes.STRING,
        ph_date: DataTypes.DATE,

        ph_to_date: DataTypes.DATE,
        ph_to_day: DataTypes.STRING,
        ph_to_month: DataTypes.STRING,
        ph_to_year: DataTypes.STRING,
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
        modelName: 'PublicHoliday',
        tableName: 'public_holidays'
    });
    return PublicHoliday;
};
