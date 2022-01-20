'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  rating.init({
    rating_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    rating_name: DataTypes.STRING,
    rating_desc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ratings',
    tableName: 'ratings'
  });
  return rating;
};
