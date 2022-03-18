'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async registerNotification(subject, body="You have a new notification", user_id, post_id, url ){
      return await Notification.create({
        n_subject:subject,
        n_body:body,
        n_user_id:user_id,
        n_post_id:post_id,
        n_url:url,
      })
    }

    static async getAllNotifications(){
      return await Notification.findAll({
        order:[['n_id', 'DESC']],
        include:[{model: employeeModel, as:'employee'}]
      })
    }

    static async getAllNotificationsByEmployeeId(empId){
      return await Notification.findAll({
        where:{n_user_id:empId},
        order:[['n_id', 'DESC']],
        include:[{model: employeeModel, as:'employee'}]
      })
    }

  };
  Notification.init({
    n_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    n_subject: DataTypes.STRING,
    n_body: DataTypes.STRING,
    n_is_read: DataTypes.INTEGER,
    n_user_id: DataTypes.INTEGER,
    n_post_id: DataTypes.INTEGER,
    n_url: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Notification',
    tableName:'notifications'
  });
  Notification.belongsTo(employeeModel, {as:'employee', foreignKey: 'n_user_id'})
  return Notification;
};
