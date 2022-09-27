'use strict';
const {
  Model
} = require('sequelize');
const { sequelize, Sequelize } = require('../services/db');
const employeeModel = require('./Employee')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async postAnnouncement(data){
      return await Announcement.create(data);
    }

    static async getAllAnnouncements(){
      return await Announcement.findAll({
        order:[['a_id', 'DESC']],
        include:[{model:employeeModel, as:'author'}]
        });
    }

    static async  getAnnouncementsByAuthorId(author_id){
      return await Announcement.findAll({
        where:{a_author:author_id}, order:[['a_id', 'DESC']],
        include:[{model:employeeModel, as:'author'}]
      })
    }

    static async getSpecificAnnouncements(){
      return await Announcement.findAll({
        where:{a_target:2}, order:[['a_id', 'DESC']],
        include:[{model:employeeModel, as:'author'}]
      })
    }

    static async getPublicAnnouncements(){
      return await Announcement.findAll({
        where:{a_target:1}, order:[['a_id', 'DESC']],
        include:[{model:employeeModel, as:'author'}]
      })
    }

    static async getAnnouncementsById(id){
      return await Announcement.findAll({
        where:{a_id:id}, order:[['a_id', 'DESC']],
        include:[{model:employeeModel, as:'author'}]
      })
    }


    static async getAnnouncementById(id){
      return await Announcement.findOne({
        where:{a_id:id},
        include:[{model:employeeModel, as:'author'}]
      })
    }
    static async updateAnnouncementAttachmentUrl(id, url){
      return await Announcement.update({
          a_attachment:url,
        },
        {where:{a_id:id},})
    }

  };
  Announcement.init({
    a_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    a_author: DataTypes.INTEGER,
    a_title: DataTypes.STRING,
    a_attachment: DataTypes.STRING,
    a_body: DataTypes.TEXT,
    a_target: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Announcement',
    tableName:'announcements'
  });
  Announcement.belongsTo(employeeModel, {as: 'author', foreignKey: 'a_author'})
  return Announcement;
};
