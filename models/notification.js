'use strict';
const {
  Model
} = require('sequelize');
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
  };
  Notification.init({
    n_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    n_subject: DataTypes.STRING,
    body: DataTypes.STRING,
    is_read: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    post_id: DataTypes.INTEGER,
    post_type: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Notification',
    tableName:'notifications'
  });
  return Notification;
};
