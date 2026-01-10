'use strict';
const {
  Model, Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Country extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }


    static async getCountries(){
      return await Country.findAll();
    }

  };
  Country.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    iso: DataTypes.STRING,
    name: DataTypes.STRING,
    nicename: DataTypes.STRING,
    iso3: DataTypes.STRING,
    numcode: DataTypes.STRING,
    phonecode: DataTypes.STRING,
    flag: DataTypes.STRING,
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Country',
    tableName: 'countries'
  });
  return Country;
};
