'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class endofyearresponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  endofyearresponse.init({
    eyr_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    eyr_goal: DataTypes.STRING,
    eyr_reflection: DataTypes.STRING,
    eyr_type: DataTypes.INTEGER,
    eyr_emp_id: DataTypes.INTEGER,
    eyr_gs_id: DataTypes.INTEGER,
    eyr_strength: DataTypes.STRING,
    eyr_growth_area: DataTypes.STRING,
    eyr_response: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'endofyearresponse',
    tableName: 'end_year_responses'
  });
  return endofyearresponse;
};