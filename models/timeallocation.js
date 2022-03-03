'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
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
    ta_ref_no: DataTypes.STRING,
    ta_date_approved: DataTypes.DATE,
    ta_approved_by: DataTypes.INTEGER,
    ta_status: DataTypes.INTEGER,
    ta_comment: DataTypes.TEXT,


  }, {
    sequelize,
    modelName: 'TimeAllocation',
    tableName: 'time_allocations'
  });
  timeallocation.belongsTo(Employee, { foreignKey: 'ta_emp_id' })
  return timeallocation;
};
