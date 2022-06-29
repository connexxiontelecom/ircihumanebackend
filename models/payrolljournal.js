'use strict';
const {sequelize, Sequelize} = require("../services/db");
const LocationModel = require("./Location")(sequelize, Sequelize.DataTypes)
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class payrollJournal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  payrollJournal.init({
    pj_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    pj_code: DataTypes.STRING,
    pj_journal_item: DataTypes.STRING,
    pj_location: DataTypes.STRING,
    pj_setup_by: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'payrollJournal',
    tableName: 'payroll_journals'
  });

  payrollJournal.belongsTo(LocationModel, {as: 'location', foreignKey: 'pj_location'})
  payrollJournal.hasMany(LocationModel, { foreignKey: 'location_id' })

  return payrollJournal;
};