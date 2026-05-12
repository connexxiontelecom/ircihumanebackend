'use strict';
const {
    Model, Op
} = require('sequelize');
//const {sequelize, Sequelize} = require("../services/db");
//const performanceMasterModel = require("../models/PerformancePlanMaster")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class PerformancePlanCategoriesOfCompetency extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

      static async addPerformancePlanCompetence(data) {
        return PerformancePlanCategoriesOfCompetency.create({
          ppcoc_ppm_id: data.performanceId,
          ppcoc_work_quality: data.work_quality,
          ppcoc_work_quantity: data.work_quantity,
          ppcoc_job_knowledge: data.job_knowledge,
          ppcoc_organization_work: data.organization_work,
          ppcoc_teamwork: data.teamwork,
          ppcoc_initiative: data.initiative_creativity,
          ppcoc_communication_skill: data.communication_skills,
        })
      }
      static async updatePerformancePlanCompetence(data, id) {
        return PerformancePlanCategoriesOfCompetency.update({
          ppcoc_ppm_id: data.performanceId,
          ppcoc_work_quality: data.work_quality,
          ppcoc_work_quantity: data.work_quantity,
          ppcoc_job_knowledge: data.job_knowledge,
          ppcoc_organization_work: data.organization_work,
          ppcoc_teamwork: data.teamwork,
          ppcoc_initiative: data.initiative_creativity,
          ppcoc_communication_skill: data.communication_skills,
        },{
          where:{ppcoc_ppm_id:id }
        })
      }

      static async getSinglePerformanceCompetenceByMasterId(masterId) {
        return PerformancePlanCategoriesOfCompetency.findOne({
          where:{ppcoc_ppm_id: masterId},
        })
      }
      /*
      static async getEmployeePerformancePlanMasterByEmpId(empId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_emp_id: empId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },

          ],
        })
      }
      static async getEmployeePerformancePlanMasterDetailByEmpId(empId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_emp_id: empId},
          include:[
            {model: Employee, as: 'employee' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getSinglePerformanceAssessmentBySupervisorId(supervisorId) {
        return PerformancePlanMaster.findOne({
          where:{ppm_supervisor_id: supervisorId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getSinglePerformanceAssessmentById(id) {
        return PerformancePlanMaster.findOne({
          where:{ppm_id: id},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getAllPerformanceAssessmentBySupervisorId(supervisorId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_supervisor_id: supervisorId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getAllPerformancePlanMaster() {
        return PerformancePlanMaster.findAll({
          include:[
            {model: Employee, as: 'employee' }
          ],
        })
      }



      static async approvePerformanceAssessment(id){
        return await PerformancePlanMaster.update({
            ppm_status:1,
          },
          {where:{ppm_id:id},})
      }
      */

    };
  PerformancePlanCategoriesOfCompetency.init({
    ppcoc_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
    ppcoc_ppm_id: DataTypes.STRING,
    ppcoc_work_quality: DataTypes.TEXT,
    ppcoc_work_quantity: DataTypes.TEXT,
    ppcoc_job_knowledge: DataTypes.TEXT,
    ppcoc_organization_work: DataTypes.TEXT,
    ppcoc_teamwork: DataTypes.TEXT,
    ppcoc_initiative: DataTypes.TEXT,
    ppcoc_communication_skill: DataTypes.TEXT,
        created_at: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updated_at: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'PerformancePlanCategoriesOfCompetency',
        tableName: 'performance_plan_categories_of_competency',
    timestamps:false
    });
  //PerformancePlanCategoriesOfCompetency.belongsTo(performanceMasterModel, { foreignKey: 'ppcoc_ppm_id',as:"ppcoc_master" });
    return PerformancePlanCategoriesOfCompetency;
};
