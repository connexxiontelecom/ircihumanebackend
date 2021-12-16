'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const User = require("../models/user")(sequelize, Sequelize.DataTypes)
module.exports = (sequelize, DataTypes) => {
  class log extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  log.init({
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    log_description: DataTypes.STRING,
    log_user_id: DataTypes.INTEGER,
    log_date: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'log',
  });

  log.belongsTo(User, { foreignKey: 'log_user_id' })
  log.hasMany(User, { foreignKey: 'user_id' })
  return log;
};
