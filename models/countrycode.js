'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CountryCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  CountryCode.init({
    cc_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    cc_code: DataTypes.STRING,
    cc_name: DataTypes.STRING,
    // createdAt: {
    //   field: 'created_at',
    //   type: DataTypes.DATE,
    // },
    // updatedAt: {
    //   field: 'updated_at',
    //   type: DataTypes.DATE,
    // },
  }, {
    sequelize,
    modelName: 'CountryCode',
    tableName: 'country_codes'
  });
  return CountryCode;
};