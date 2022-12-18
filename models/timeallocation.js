'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const LocationModel = require("../models/Location")(sequelize, Sequelize.DataTypes)
const SectorModel = require("../models/Department")(sequelize, Sequelize.DataTypes)
const JobroleModel = require("../models/JobRole")(sequelize, Sequelize.DataTypes)
const AuthorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes)
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

    static async getTimesheetSubmissionByStatus(status){
      return await timeallocation.findAll({
        where:{ta_status:status},
        include:[
          {model:Employee, as:'employee',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
            ]},
          {model:AuthorizationModel, as:'timesheet_authorizer', include:[{model: Employee, as: 'officers'}]},
        ],
        order:[['ta_id', 'DESC']]
      })
    }
    static async getTimesheetSubmissionByRefNo(ref_no){
      return await timeallocation.findAll({
        where:{ta_ref_no:ref_no},
        include:[
          {model:Employee, as:'employee',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
            ]},
          {model:AuthorizationModel, as:'timesheet_authorizer',
            include:[{model: Employee, as: 'officers'}]
          },
        ],
        order:[['ta_id', 'DESC']]
      })
    }
    static async getTimesheetSubmissionByMonthYear(month, year){
      return await timeallocation.findAll({
        where:{ta_month:month, ta_year: year},
        include:[
          {model:Employee, as:'employee',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
            ]},
          {model:AuthorizationModel, as:'timesheet_authorizer',
            include:[{model: Employee, as: 'officers'}]
          },
        ],
        order:[['ta_id', 'DESC']]
      })
    }
    static async getTimesheetSubmissionByMonthYearEmpds(month, year, empIds){
      return await timeallocation.findAll({
        where:{ta_month:month, ta_year: year, ta_emp_id:empIds},
        include:[
          {model:Employee, as:'employee',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
              {model:JobroleModel, as: 'jobrole'},
            ]},
          {model:AuthorizationModel, as:'timesheet_authorizer',
            include:[{model: Employee, as: 'officers'}]
          },
        ],
        order:[['ta_id', 'DESC']]
      })
    }
    static async getOneTimesheetSubmissionByRefNo(ref_no){
      return await timeallocation.findOne({
        where:{ta_ref_no:ref_no},
        include:[
          {model:Employee, as:'employee',
            include:[
              {model:LocationModel, as: 'location'},
              {model:SectorModel, as: 'sector'},
            ]},
          {model:AuthorizationModel, as:'timesheet_authorizer',
            include:[{model: Employee, as: 'officers'}]
          },
        ],
        order:[['ta_id', 'DESC']]
      })
    }

static async updateTimesheetStatus (refNo, status){
      return await timeallocation.update({
          ta_status:status},
        {where:{ta_ref_no: refNo}
        });
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
    ta_t0_percent: DataTypes.STRING,
    ta_t0_code: DataTypes.STRING,
    ta_date_approved: DataTypes.DATE,
    ta_approved_by: DataTypes.INTEGER,
    ta_status: DataTypes.INTEGER,
    ta_comment: DataTypes.TEXT,


  }, {
    sequelize,
    modelName: 'TimeAllocation',
    tableName: 'time_allocations'
  });
  timeallocation.belongsTo(Employee, { foreignKey: 'ta_emp_id', as: 'employee' })
  timeallocation.belongsTo(AuthorizationModel,
    { foreignKey: 'ta_ref_no', as: 'timesheet_authorizer', sourceKey:'auth_officer_id' }
    )
  return timeallocation;
};
