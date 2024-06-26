'use strict';
const { Model } = require('sequelize');
const { sequelize, Sequelize } = require("../services/db");
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const locationModel = require("../models/Location")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
  class payrollmonthyearlocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getActionedBy(locationId, month, year, type) {
      return await payrollmonthyearlocation.findOne({
        include: [
          {model: EmployeeModel, as: type},
        ],
        where: {pmyl_location_id: locationId, pmyl_month: month, pmyl_year: year}

      })
    }
    static async getLocation(locationId, month, year) {
      return await payrollmonthyearlocation.findOne({
        include: [
          {model: locationModel, as: 'location'},
        ],
        where: {pmyl_location_id: locationId, pmyl_month: month, pmyl_year: year}

      })
    }
    
    
  }
  payrollmonthyearlocation.init(
    {
      pmyl_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      pmyl_month: DataTypes.INTEGER,
      pmyl_year: DataTypes.INTEGER,
      pmyl_location_id: DataTypes.INTEGER,
      pmyl_confirmed: DataTypes.INTEGER,
      pmyl_confirmed_by: DataTypes.TEXT,
      pmyl_confirmed_date: DataTypes.DATE,
      pmyl_authorised: DataTypes.INTEGER,
      pmyl_authorised_by: DataTypes.TEXT,
      pmyl_authorised_date: DataTypes.DATE,
      pmyl_authorised_comment: DataTypes.TEXT,
      pmyl_approved: DataTypes.INTEGER,
      pmyl_approved_by: DataTypes.TEXT,
      pmyl_approved_comment: DataTypes.TEXT,
      pmyl_approved_date: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'payrollmonthyearlocation',
      tableName: 'payroll_month_year_locations'
    }
  );

  payrollmonthyearlocation.belongsTo(EmployeeModel, {as: 'authorizedBy', foreignKey: 'pmyl_authorised_by'});
  payrollmonthyearlocation.belongsTo(EmployeeModel, {as: 'approvedBy', foreignKey: 'pmyl_approved_by'});
  payrollmonthyearlocation.belongsTo(EmployeeModel, {as: 'confirmedBy', foreignKey: 'pmyl_confirmed_by'});
  payrollmonthyearlocation.belongsTo(locationModel, {as: 'location', foreignKey: 'pmyl_location_id'});

  return payrollmonthyearlocation;
};
