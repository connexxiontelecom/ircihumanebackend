'use strict';
const { Model } = require('sequelize');
const { sequelize, Sequelize } = require('../services/db');
const Employee = require('../models/Employee')(sequelize, Sequelize.DataTypes);
//const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes)
const LocationModel = require('../models/Location')(sequelize, Sequelize.DataTypes);
const SectorModel = require('../models/Department')(sequelize, Sequelize.DataTypes);
const AuthorizationModel = require('../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
  class TravelApplication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getTravelApplicationsByStatus(status) {
      return await TravelApplication.findAll({
        where: { travelapp_status: status },
        include: [
          {
            model: Employee,
            as: 'applicant',
            include: [
              { model: LocationModel, as: 'location' },
              { model: SectorModel, as: 'sector' }
            ]
          },
          { model: AuthorizationModel, as: 'authorizers', include: [{ model: Employee, as: 'officers' }] }
        ],
        order: [['travelapp_id', 'DESC']]
      });
    }

    static async getTravelApplicationsById(travelId) {
      return await TravelApplication.findOne({
        where: { travelapp_id: travelId }
        /*include:[
          {model:Employee, as:'applicant',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
            ]},
          {model:AuthorizationModel, as:'authorizers', include:[{model: Employee, as: 'officers'}]},
        ],*/
      });
    }
  }
  TravelApplication.init(
    {
      travelapp_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      travelapp_employee_id: DataTypes.INTEGER,
      travelapp_travel_cat: DataTypes.INTEGER,
      travelapp_purpose: DataTypes.STRING,
      travelapp_start_date: DataTypes.DATE,
      travelapp_end_date: DataTypes.DATE,
      travelapp_total_days: DataTypes.INTEGER,
      travelapp_t1_code: DataTypes.STRING,
      travelapp_t2_code: DataTypes.STRING,

      travelapp_verified_by: DataTypes.INTEGER,
      travelapp_date_verified: DataTypes.DATE,
      travelapp_verify_comment: DataTypes.STRING,
      travelapp_approved_by: DataTypes.INTEGER,
      travelapp_date_approved: DataTypes.DATE,
      travelapp_approve_comment: DataTypes.STRING,
      travelapp_status: { type: DataTypes.INTEGER, defaultValue: 0, comment: '0=pending,1=approved,2=declined' },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE
      },
      updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE
      },
      travelapp_per_diem: DataTypes.DOUBLE,
      travelapp_currency: DataTypes.STRING,
      travelapp_days: DataTypes.INTEGER,
      travelapp_total: DataTypes.STRING,
      travelapp_hotel: DataTypes.INTEGER,
      travelapp_city: DataTypes.STRING,
      travelapp_arrival_date: DataTypes.DATE,
      travelapp_departure_date: DataTypes.DATE,
      travelapp_preferred_hotel: DataTypes.STRING,
      travelapp_d3_id: DataTypes.STRING,
      travelapp_d4_id: DataTypes.STRING,
      travelapp_d5_id: DataTypes.STRING,
      travelapp_trip_type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'TravelApplication',
      tableName: 'travel_applications',
      timestamps: false
    }
  );
  TravelApplication.belongsTo(Employee, { foreignKey: 'travelapp_employee_id', as: 'applicant' });
  TravelApplication.belongsTo(AuthorizationModel, { foreignKey: 'travelapp_id', as: 'authorizers', sourceKey: 'auth_travelapp_id' });

  return TravelApplication;
};
