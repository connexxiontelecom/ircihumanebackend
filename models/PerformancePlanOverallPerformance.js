'use strict';
const {
    Model, Op
} = require('sequelize');


module.exports = (sequelize, DataTypes) => {
    class PerformancePlanOverallPerformance extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

      static async addPerformancePlanMaster(data) {
        return PerformancePlanOverallPerformance.create({
          ppop_ppm_id: data.performanceId,
          ppop_rate_employee: data.rate_employee,
          ppop_supervisor_recommendation: data.supervisor_recommendation,
        })
      }
      static async updatePerformancePlanMaster(data, id) {
        return PerformancePlanOverallPerformance.update({
          ppop_ppm_id: data.performanceId,
          ppop_rate_employee: data.rate_employee,
          ppop_supervisor_recommendation: data.supervisor_recommendation,
        },{
          where:{ ppop_ppm_id: id}
        })
      }

      static async getSingleOverallPerformanceByMasterId(id) {
        return PerformancePlanOverallPerformance.findOne({
          where:{ppop_ppm_id: id},
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
  PerformancePlanOverallPerformance.init({
    ppop_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
    ppop_ppm_id: DataTypes.STRING,
    ppop_rate_employee: DataTypes.TEXT,
    ppop_supervisor_recommendation: DataTypes.TEXT,
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
        modelName: 'PerformancePlanOverallPerformance',
        tableName: 'performance_plan_overall_performance',
    timestamps:false
    });
  //PerformancePlanOverallPerformance.belongsTo(performanceMasterModel, { foreignKey: 'ppop_ppm_id',as:"ppop_master" });
    return PerformancePlanOverallPerformance;
};
