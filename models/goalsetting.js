'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class goalSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  goalSetting.init({
    gs_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    gs_from: DataTypes.STRING,
    gs_to: DataTypes.STRING,
    gs_year: DataTypes.STRING,
    gs_activity: DataTypes.STRING,
    gs_status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'goalSetting',
    tableName: 'goal_settings'
  });
  return goalSetting;
};
