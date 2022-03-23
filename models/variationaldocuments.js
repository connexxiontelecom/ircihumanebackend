'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VariationalDocuments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  VariationalDocuments.init({
    vd_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    vd_year: DataTypes.INTEGER,
    vd_month: DataTypes.INTEGER,
    vd_emp_id: DataTypes.INTEGER,
    vd_doc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VariationalDocuments',
    tableName: 'variational_documents'
  });
  return VariationalDocuments;
};