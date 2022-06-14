'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reportingentity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getAllReportingEntities(){
      return await reportingentity.findAll();
    }
  };
  reportingentity.init({
    re_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    re_name: DataTypes.STRING
  }, {
    sequelize,
    tableName: 'reporting_entities',
    modelName: 'reportingentity',
  });
  return reportingentity;
};
