'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GoalSettingYear extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  GoalSettingYear.init({
    gsy_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    gsy_year: DataTypes.TEXT
  }, {
    sequelize,
    tableName: 'goal_settings_year',
    modelName: 'GoalSettingYear',
  });
  return GoalSettingYear;
};
