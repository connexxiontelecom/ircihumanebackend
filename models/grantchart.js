'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Location = require("../models/Location")(sequelize, Sequelize.DataTypes)
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes)
const Donor = require("../models/donor")(sequelize, Sequelize.DataTypes)

module.exports = (sequelize, DataTypes) => {
  class grantChart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  grantChart.init({
    gc_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    gc_location_id: DataTypes.INTEGER,
    gc_department_id: DataTypes.INTEGER,
    gc_expense: DataTypes.STRING,
    gc_account_code: DataTypes.STRING,
    gc_description: DataTypes.STRING,
    gc_amount: DataTypes.DECIMAL,
    gc_donor_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'grantChart',
    tableName: 'grant_charts'
  });

  grantChart.belongsTo(Department, { foreignKey: 'gc_department_id' })
  grantChart.hasMany(Department, { foreignKey: 'department_id' })

  grantChart.belongsTo(Location, { foreignKey: 'gc_location_id' })
  grantChart.hasMany(Location, { foreignKey: 'location_id' })

  grantChart.belongsTo(Donor, { foreignKey: 'gc_donor_id' })
  grantChart.hasMany(Donor, { foreignKey: 'donor_id' })

  return grantChart;
};
