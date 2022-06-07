'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
  Model
} = require('sequelize');
const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const goalSettingModel = require("../models/goalsetting")(sequelize, Sequelize.DataTypes);
const locationModel = require("../models/Location")(sequelize, Sequelize.DataTypes);
const sectorModel = require("../models/Department")(sequelize, Sequelize.DataTypes);
const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
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
  selfassessmentmaster.belongsTo(authorizationModel,
    { foreignKey: 'sam_supervisor_id', as: 'authorizers', sourceKey: 'travelapp_id' });
  return selfassessmentmaster;
};
