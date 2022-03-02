'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    user_username:  DataTypes.STRING,
    user_name:  DataTypes.STRING,
    user_email: DataTypes.STRING,
    user_password: DataTypes.STRING,
    user_type: DataTypes.INTEGER,
    user_token: DataTypes.STRING,
    user_status: DataTypes.INTEGER,

  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });
  return User;
};
