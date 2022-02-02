'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class endYearRatings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  endYearRatings.init({
    eyr_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    eyr_empid: DataTypes.INTEGER,
    eyr_year: DataTypes.STRING,
    eyr_rating: DataTypes.INTEGER,
    eyr_by: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'endYearRatings',
    tableName: 'end_year_ratings'
  });
  return endYearRatings;
};
