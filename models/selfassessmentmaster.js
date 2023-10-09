'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const goalSettingModel = require("../models/goalsetting")(sequelize, Sequelize.DataTypes);
const locationModel = require("../models/Location")(sequelize, Sequelize.DataTypes);
const sectorModel = require("../models/Department")(sequelize, Sequelize.DataTypes);
const selfAssessmentModel = require("../models/selfassessment")(sequelize, Sequelize.DataTypes);
const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const endYearResponseModel = require("../models/endofyearresponse")(sequelize, Sequelize.DataTypes);
//const endYearSupervisorResponseModel = require("../models/endyearsupervisorresponse")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
  class selfassessmentmaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async updateSelfAssessmentStatus(goalId, empId){
      return await selfassessmentmaster.update({
        sam_status:1,
      },{
        where:{sam_gs_id:goalId, sam_emp_id:empId}
      })
    }

    static async getEmployeeSelfAssessment(empId){
      return await selfassessmentmaster.findAll({
        include:[{model:EmployeeModel, as:'supervisor'}, {model:goalSettingModel, as:'goal'}],
        where:{sam_emp_id:empId}, order:[['sam_id', 'DESC']]
      })
    }
    static async checkEmployeeAssessment(goalId, empId){
      return await selfassessmentmaster.findOne({
        include:[{model:EmployeeModel, as:'supervisor'}, {model:goalSettingModel, as:'goal'}],
        where:{sam_emp_id:empId, sam_gs_id:goalId}
      })
    }
    static async getSelfAssessmentMasterByGoalSettingIdEmpId(goalId, empId){
      return await selfassessmentmaster.findOne({
        where:{sam_emp_id:empId, sam_gs_id:goalId}
      })
    }
    static async getSupervisorSelfAssessment(empIds){
      return await selfassessmentmaster.findAll({
        include:[{model:EmployeeModel, as:'employee'}, {model:goalSettingModel, as:'goal'}],
        where:{sam_emp_id:empIds}, order:[['sam_id', 'DESC']]
      })
    }
  static async getSelfAssessmentMasterByGsIdEmpIdYear(gsId, empId, year){
      return await selfassessmentmaster.findOne({
        include:[{model:EmployeeModel, as:'employee'}, {model:goalSettingModel, as:'goal'}],
        where:{sam_emp_id:empId, sam_gs_id: gsId, sam_year:year},
      })
    }

    static async updateSelfAssessmentMasterStatusByGsIdEmpIdYear(gsId, empId, year, status){
      return await selfassessmentmaster.update(
      {sam_status:status},
        {where:{sam_emp_id:empId, sam_gs_id: gsId, sam_year:year},}
      )
    }

    static async getAllSelfAssessments(){
      return await selfassessmentmaster.findAll({
        include:[
          {model:EmployeeModel, as:'employee',
            include: [
              {model: locationModel, as: 'location'},
              {model: sectorModel, as: 'sector'},
            ]},
          {model:goalSettingModel, as:'goal'},
          {model: EmployeeModel, as:'supervisor'}
        ],
        where: {sam_status:1 }, //only approved
        order:[ ['sam_id', 'DESC'] ],
        group: ['sam_year', 'sam_emp_id']
      })
    }

    static async generateEmployeesSelfAssessmentReport(empIds, gs_id, fy) {
      return await selfassessmentmaster.findAll({
        include:[
          {model:EmployeeModel, as:'employee',
            include: [
              {model: locationModel, as: 'location'},
              {model: sectorModel, as: 'sector'},
            ]},
          { model: selfAssessmentModel, as: 'self_assessment' },
          {model: EmployeeModel, as:'supervisor'}
        ],
        where: {
          sam_emp_id: empIds,
          sam_gs_id: gs_id,
          sam_year: fy,
        }
      });
    }
    static async generateEmployeesEndOfYearSelfAssessmentReport(empIds, stage, fy) {
      return await selfassessmentmaster.findAll({
        include:[
          {model:EmployeeModel, as:'employee',
            include: [
              {model: locationModel, as: 'location'},
              {model: sectorModel, as: 'sector'},
            ]},
          { model: endYearResponseModel, as: 'end_year_response' },
          {model: EmployeeModel, as:'supervisor'},
          //{model: endYearSupervisorResponseModel, as:'end_year_supervisor_response'}
        ],
        where: {
          sam_emp_id: empIds,
          sam_gs_id: stage,
          sam_year: fy,
        }
      });
    }

    static async getAllSelfAssessmentsByStatus(status){
      return await selfassessmentmaster.findAll({
        include:[
          {model:EmployeeModel, as:'employee',
            include: [
              {model: locationModel, as: 'location'},
              {model: sectorModel, as: 'sector'},
            ]},
          {model:goalSettingModel, as:'goal'},
          {model: EmployeeModel, as:'supervisor'}
        ],
        where: {sam_status:status }, //only approved
        order:[ ['sam_id', 'DESC'] ],
        group: ['sam_year', 'sam_emp_id']
      })
    }
    static async getAllEmployeeSelfAssessments(empId, year){
      return await selfassessmentmaster.findAll({
        where: { sam_year: year, sam_emp_id: empId },
        include:[
          {model:EmployeeModel, as:'employee'},
          {model:goalSettingModel, as:'goal'},
          {model: EmployeeModel, as:'supervisor'}
        ],
      })
    }



    static async getAllFYs(){
      return await selfassessmentmaster.findAll({
        attributes:['sam_year'],
        order:[ ['sam_id', 'DESC'] ],
        group: ['sam_year']
      })
    }

  };
  selfassessmentmaster.init({
    sam_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    sam_gs_id: DataTypes.INTEGER,
    sam_emp_id: DataTypes.INTEGER,
    sam_status: DataTypes.INTEGER,
    sam_supervisor_id: DataTypes.INTEGER,
    sam_optional: DataTypes.TEXT,
    sam_discussion_held_on: DataTypes.DATE,
    sam_year: DataTypes.STRING,
    createdAt: {
      //field: 'created_at',
      type: DataTypes.DATE,
      defaultValue:sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      //field: 'updated_at',
      type: DataTypes.DATE,
      defaultValue:sequelize.literal('CURRENT_TIMESTAMP'),
    },

  }, {
    sequelize,
    modelName: 'self_assessment_master',
    tableName: 'self_assessment_master',
    timestamps:false
  });
  selfassessmentmaster.belongsTo(EmployeeModel,{foreignKey:'sam_supervisor_id', as:'supervisor'});
  selfassessmentmaster.belongsTo(EmployeeModel,{foreignKey:'sam_emp_id', as:'employee'});
  selfassessmentmaster.belongsTo(goalSettingModel,{foreignKey:'sam_gs_id', as:'goal'});
  selfassessmentmaster.hasMany(selfAssessmentModel,{foreignKey:'sa_master_id', as:'self_assessment'});
  selfassessmentmaster.hasMany(endYearResponseModel,{foreignKey:'eyr_master_id', as:'end_year_response'});
  //selfassessmentmaster.hasMany(endYearSupervisorResponseModel,{foreignKey:'eyr_master_id', as:'end_year_supervisor_response'});
  selfassessmentmaster.belongsTo(authorizationModel,
    { foreignKey: 'sam_supervisor_id', as: 'authorizers', sourceKey: 'travelapp_id' });
  return selfassessmentmaster;
};
