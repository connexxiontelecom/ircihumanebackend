'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class goalSettingLogs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  goalSettingLogs.init({
    gsl_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    gsl_gs_year: DataTypes.STRING,
    gsl_activity: DataTypes.STRING,
    gsl_year: DataTypes.STRING,
    gsl_status: DataTypes.INTEGER
  }, {
    sequelize,
    tableName: 'goal_settings_logs',
    modelName: 'goalSettingLogs',
  });
  return goalSettingLogs;
};
