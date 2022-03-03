'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class donor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  donor.init({
    donor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    donor_code: DataTypes.STRING,
    donor_description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'donor',
    tableName: 'donors'
  });
  return donor;
};
