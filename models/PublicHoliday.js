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

        static async getPublicHolidayByGroup(groupId){
          return PublicHoliday.findAll({where: {'ph_group': groupId}});
        }
        static async destroyPublicHolidayByGroup(groupId){
          return PublicHoliday.destroy({where: {'ph_group': groupId}});
        }

        static async archivePublicHolidayByGroup(groupId){
          return PublicHoliday.update(
            {ph_archive: 1},
            {where: {'ph_group': groupId}}
          );
        }

        static async getThisYearsPublicHolidays(){
          return await PublicHoliday.findAll({
            where: {ph_year: new Date().getFullYear(), ph_archive:0}
          })
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
        ph_group: DataTypes.STRING,
        ph_archive: DataTypes.INTEGER,
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
