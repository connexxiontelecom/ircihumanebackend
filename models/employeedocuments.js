'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmployeeDocuments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  EmployeeDocuments.init({
    ed_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    ed_empid: DataTypes.INTEGER,
    ed_doc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EmployeeDocuments',
    tableName: 'employee_documents'
  });
  return EmployeeDocuments;
};