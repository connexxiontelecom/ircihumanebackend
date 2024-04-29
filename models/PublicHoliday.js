'use strict';
const {
    Model, Op
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

        static async getOnePublicHolidayByGroup(groupId){
          return PublicHoliday.findOne({where: {'ph_group': groupId}});
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

        static async getThisYearsPublicHolidaysByLocation(locationId){
          return await PublicHoliday.findAll({
            where:{ph_location: {[Op.in]:locationId}, ph_archive:0  },
          })
        }
        
        static async getPublicHolidayByDate(date){
          return await PublicHoliday.findOne({
            where:{ph_date: {[Op.eq]:date} },
          })
        }


        static async getThisYearsPublicHolidays(){
          //const currentMonth = new Date().getMonth()+1;
          //let currentYear = new Date().getFullYear();
          //const calendarYear = `${currentMonth} <= 9 ? ${currentYear} : ${currentYear+1}`;
          return await PublicHoliday.findAll({
            where: { ph_archive:0}
            //where: {ph_year: calendarYear, ph_archive:0}
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
        //ph_location: DataTypes.INTEGER,
        ph_to_date: DataTypes.DATE,
        ph_to_day: DataTypes.STRING,
        ph_to_month: DataTypes.STRING,
        ph_to_year: DataTypes.STRING,
        ph_group: DataTypes.STRING,
        ph_archive: DataTypes.INTEGER,
        ph_location: DataTypes.STRING,
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
