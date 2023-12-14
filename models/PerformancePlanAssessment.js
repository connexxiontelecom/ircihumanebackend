'use strict';
const {
    Model, Op
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
//const PerformancePlanMasterModel = require("../models/PerformancePlanMaster")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class PerformancePlanAssessment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
      static async getPerformanceAssessment() {
        return PerformancePlanAssessment.findAll({
        /*  include:[
            {model: PerformancePlanMasterModel, as: 'performance_master' }
          ],*/
        })
      }

      static async getPerformanceAssessmentsByPpmId(id) {
        return PerformancePlanAssessment.findAll({
          where:{ppa_ppm_id: id}
        })
      }

      static async addPerformanceAssessment(data) {
        return PerformancePlanAssessment.create({
          ppa_goal: data.goal,
          ppa_ppm_id: data.ppm_id
        })
      }
      static async savePerformanceAssessment(data) {
        return PerformancePlanAssessment.create({
          ppa_goal: data.goal,
          ppa_ppm_id: data.ppm_ppm_id,
          ppa_performance_measure: data.ppm_measure || null,
          ppa_achievements: data.ppm_achievement || null,
        })
      }
      static async destroyPerformanceAssessment(performanceId){
        return PerformancePlanAssessment.destroy({where: {'ppa_ppm_id': performanceId}});
      }

      static async updatePerformanceAssessment(goals,id) {
        goals.map(data=>{
          PerformancePlanAssessment.update({
            ppa_goal: data.goal,
            ppa_performance_measure: data.measure,
          },{
            where:{
              ppa_id:id,
            }
          })
        })


      }
/*

      static async getEmployeePerformanceImprovement(empId) {
        return PerformanceImprovement.findAll({
          where:{pi_emp_id: empId},
        })
      }


      static async updatePerformanceStatus(id, status){
        return await PerformanceImprovement.update({
            pi_status:status,
          },
          {where:{pi_id:id},})
      }
      */

    };
  PerformancePlanAssessment.init({
        ppa_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        ppa_ppm_id: DataTypes.INTEGER,
        ppa_goal: DataTypes.TEXT,
        ppa_performance_measure: DataTypes.TEXT,
        ppa_performance_review: DataTypes.TEXT,
        ppa_review_date: DataTypes.DATE,
      ppa_achievements: DataTypes.TEXT,
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
        modelName: 'PerformancePlanAssessment',
        tableName: 'performance_plan_assessment',
    timestamps:false
    });
    //PerformancePlanAssessment.belongsTo(PerformancePlanMasterModel, { foreignKey: 'ppa_ppm_id',as:"performance_master" });
    return PerformancePlanAssessment;
};
