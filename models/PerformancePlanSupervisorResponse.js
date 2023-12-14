'use strict';
const {
    Model, Op
} = require('sequelize');
//const {sequelize, Sequelize} = require("../services/db");
//const PerformancePlanMaster = require("../models/PerformancePlanMaster")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class PerformancePlanSupervisorResponse extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

      static async addSupervisorEndOfYearPerformanceResponse(data) {
        return PerformancePlanSupervisorResponse.create({
          ppsr_ppm_id: data.performanceId,
          ppsr_critical_accomplishment: data.accomplishments,
          ppsr_employee_strength: data.employee_strength,
          ppsr_growth_areas: data.growth_areas,
          ppsr_action_plan: data.action_plan,
          ppsr_additional_supervisor_comment: data.supervisor_comment,
          ppsr_status:0
        })
      }
      static async updateSupervisorEndOfYearPerformanceResponse(data, ppmId) {
        return PerformancePlanSupervisorResponse.update({
          ppsr_ppm_id: data.performanceId,
          ppsr_critical_accomplishment: data.accomplishments,
          ppsr_employee_strength: data.employee_strength,
          ppsr_growth_areas: data.growth_areas,
          ppsr_action_plan: data.action_plan,
          ppsr_additional_supervisor_comment: data.supervisor_comment,
        },{
          where:{ppsr_ppm_id: ppmId}
        })
      }

      static async getSingleSupervisorEndOfYearPerformanceResponseById(id) {
        return PerformancePlanSupervisorResponse.findOne({
          where:{ppsr_ppm_id: id},
        })
      }

      static async updateSupervisorEndOfYearPerformanceStatus(status, ppmId) {
        return PerformancePlanSupervisorResponse.update({
          ppsr_status: status,
        },{
          where:{ppsr_ppm_id: ppmId}
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

      static async getSingleEmployeePerformancePlanMasterDetailById(performanceId) {
        return PerformancePlanMaster.findOne({
          where:{ppm_id: performanceId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
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
  PerformancePlanSupervisorResponse.init({
    /*







     */
    ppsr_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
    ppsr_ppm_id: DataTypes.STRING,
    ppsr_critical_accomplishment: DataTypes.TEXT,
    ppsr_employee_strength: DataTypes.TEXT,
    ppsr_growth_areas: DataTypes.TEXT,
    ppsr_action_plan: DataTypes.TEXT,
    ppsr_additional_supervisor_comment: DataTypes.TEXT,
    ppsr_status: DataTypes.STRING,
    ppsr_date_approved: DataTypes.DATE,
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
        modelName: 'PerformancePlanSupervisorResponse',
        tableName: 'performance_plan_supervisor_response',
    timestamps:false
    });

  //PerformancePlanSupervisorResponse.belongsTo(PerformancePlanMaster, { foreignKey: 'ppsr_ppm_id',as:"s_response" });
    return PerformancePlanSupervisorResponse;
};
