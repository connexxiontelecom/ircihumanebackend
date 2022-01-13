'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class timeallocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  timeallocation.init(      {
    ta_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    ta_emp_id: DataTypes.INTEGER,
    ta_month: DataTypes.TEXT,
    ta_year: DataTypes.TEXT,
    ta_tcode: DataTypes.TEXT,
    ta_charge: DataTypes.DOUBLE,


  }, {
    sequelize,
    modelName: 'TimeAllocation',
    tableName: 'time_allocations'
  });
  return timeallocation;
};
