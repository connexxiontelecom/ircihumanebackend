'use strict';
const {sequelize, Sequelize} = require("../services/db");
const LocationModel = require("./Location")(sequelize, Sequelize.DataTypes)
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salarymappingmaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  salarymappingmaster.init({
    smm_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    smm_month: DataTypes.INTEGER,
    smm_year: DataTypes.INTEGER,
    smm_location: DataTypes.INTEGER,
    smm_ref_code: DataTypes.STRING,
    smm_posted: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'salarymappingmaster',
    tableName: 'salary_mapping_master'
  });

salarymappingmaster.belongsTo(LocationModel, {as: 'location', foreignKey: 'smm_location'})
salarymappingmaster.hasMany(LocationModel, { foreignKey: 'location_id' })

  return salarymappingmaster;
};