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
