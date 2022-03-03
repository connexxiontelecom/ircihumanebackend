'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');


const Location = require("../models/Location")(sequelize, Sequelize.DataTypes)
const Pd = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)

module.exports = (sequelize, DataTypes) => {
  class locationAllowance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };


  locationAllowance.init({
    la_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    la_payment_id: DataTypes.NUMBER,
    la_location_id: DataTypes.NUMBER,
    la_amount: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'locationAllowance',
    tableName: 'location_allowances'
  });

  locationAllowance.belongsTo(Location, { foreignKey: 'la_location_id' })
  locationAllowance.hasMany(Location, { foreignKey: 'location_id' })

  locationAllowance.belongsTo(Pd, { foreignKey: 'la_payment_id' })
  locationAllowance.hasMany(Pd, { foreignKey: 'pd_id' })


  return locationAllowance;
};
