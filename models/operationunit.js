'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class operationunit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static async getAllOperationUnits(){
      return await operationunit.findAll();
    }
  };
  operationunit.init({
    ou_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    ou_name: DataTypes.STRING
  }, {
    sequelize,
    tableName: 'operation_units',
    modelName: 'operationunit',
  });
  return operationunit;
};
